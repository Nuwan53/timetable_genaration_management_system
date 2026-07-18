# Save this as api/scheduler.py — a standalone module, imported by views.py.
# Keeping the algorithm separate from the view keeps the CSP logic testable
# and easy to point to directly in your dissertation/viva.

from .models import TimeSlot, Venue, ScheduleSlot

NODE_LIMIT = 20000  # safety cap so a pathological input can't hang the request


def _load_existing_bookings(semester):
    """
    Pulls every already-committed ScheduleSlot for the semester and indexes
    it by lecturer and venue, so the solver treats real bookings as hard
    constraints from the very first move — not just conflicts against
    other requirements in this run.
    """
    lecturer_busy = {}
    venue_busy = {}
    for row in ScheduleSlot.objects.filter(semester=semester).values('lecturer_id', 'venue_id', 'timeslot_id'):
        lecturer_busy.setdefault(row['lecturer_id'], set()).add(row['timeslot_id'])
        venue_busy.setdefault(row['venue_id'], set()).add(row['timeslot_id'])
    return lecturer_busy, venue_busy


def generate_timetable_for_group(group_id, semester, requirements):
    """
    requirements: list of dicts, each: {course_id, lecturer_id, venue_type (optional)}
    One dict = one weekly session that needs a TimeSlot + Venue assigned.

    Returns (assignments, is_complete):
      assignments: list, same length/order as requirements, each either
                   {timeslot, venue} or None if that requirement couldn't be placed.
      is_complete: True if every requirement was successfully placed.
    """
    all_timeslots = list(TimeSlot.objects.all().order_by('start_time'))
    all_venues = list(Venue.objects.all())

    existing_group_slots = set(
        ScheduleSlot.objects.filter(group_id=group_id, semester=semester).values_list('timeslot_id', flat=True)
    )
    lecturer_busy, venue_busy = _load_existing_bookings(semester)

    def venue_candidates(req):
        if req.get('venue_type'):
            return [v for v in all_venues if v.venue_type == req['venue_type']]
        return all_venues

    def run_backtracking():
        group_used = set(existing_group_slots)
        lecturer_used = {k: set(v) for k, v in lecturer_busy.items()}
        venue_used = {k: set(v) for k, v in venue_busy.items()}
        assignments = [None] * len(requirements)
        node_counter = {'count': 0}

        def backtrack(i):
            node_counter['count'] += 1
            if node_counter['count'] > NODE_LIMIT:
                return False
            if i == len(requirements):
                return True

            req = requirements[i]
            lecturer_id = req['lecturer_id']

            for ts in all_timeslots:
                if ts.id in group_used:
                    continue
                if ts.id in lecturer_used.get(lecturer_id, set()):
                    continue

                for venue in venue_candidates(req):
                    if ts.id in venue_used.get(venue.id, set()):
                        continue

                    # place tentatively
                    assignments[i] = (ts, venue)
                    group_used.add(ts.id)
                    lecturer_used.setdefault(lecturer_id, set()).add(ts.id)
                    venue_used.setdefault(venue.id, set()).add(ts.id)

                    if backtrack(i + 1):
                        return True

                    # undo — this is the "backtrack" step
                    group_used.discard(ts.id)
                    lecturer_used[lecturer_id].discard(ts.id)
                    venue_used[venue.id].discard(ts.id)
                    assignments[i] = None

            return False

        success = backtrack(0)
        return assignments, success

    assignments, success = run_backtracking()

    if success:
        return assignments, True

    # Fallback: full backtracking couldn't fit everything (or hit the node
    # cap). Re-run as a simple greedy first-fit instead, so Admin still gets
    # a partial, useful result rather than nothing.
    group_used = set(existing_group_slots)
    lecturer_used = {k: set(v) for k, v in lecturer_busy.items()}
    venue_used = {k: set(v) for k, v in venue_busy.items()}
    assignments = [None] * len(requirements)

    for i, req in enumerate(requirements):
        lecturer_id = req['lecturer_id']
        for ts in all_timeslots:
            if ts.id in group_used or ts.id in lecturer_used.get(lecturer_id, set()):
                continue
            placed = False
            for venue in venue_candidates(req):
                if ts.id in venue_used.get(venue.id, set()):
                    continue
                assignments[i] = (ts, venue)
                group_used.add(ts.id)
                lecturer_used.setdefault(lecturer_id, set()).add(ts.id)
                venue_used.setdefault(venue.id, set()).add(ts.id)
                placed = True
                break
            if placed:
                break

    return assignments, False