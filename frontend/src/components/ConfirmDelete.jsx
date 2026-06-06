import Modal from './Modal';
export default function ConfirmDelete({ name, onConfirm, onClose }) {
  return (
    <Modal title="Confirm Delete" onClose={onClose}>
      <p style={{fontSize:14,color:'#64748b',marginBottom:20}}>
        Are you sure you want to delete <strong>{name}</strong>? This cannot be undone.
      </p>
      <div className="modal-footer">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
      </div>
    </Modal>
  );
}
