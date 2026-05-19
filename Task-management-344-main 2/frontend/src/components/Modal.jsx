const Modal = ({ open, onClose, title, children, footer }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-xl leading-none">&times;</button>
        </div>
        <div className="px-6 py-4">{children}</div>
        {footer && <div className="border-t px-6 py-3 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
