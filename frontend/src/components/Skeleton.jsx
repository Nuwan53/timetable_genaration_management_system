export default function Skeleton({ columns = 1, rows = 5 }) {
  return (
    <>
      {[...Array(rows)].map((_, i) => (
        <tr key={i} className="skeleton-row">
          {[...Array(columns)].map((_, j) => (
            <td key={j}>
              <div className="skeleton-box"></div>
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
