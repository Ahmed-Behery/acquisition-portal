import MuiModal from '@mui/material/Modal';

/**
 * The application modal.
 *
 * The markup and classes are exactly the original's (`.modal-bg` → `.modal` →
 * header / body / footer), so nothing shifts visually. MUI's unstyled `Modal` is
 * used underneath purely for behaviour the original lacked: it portals to the body,
 * traps focus, restores it on close, closes on Escape, marks the page behind as
 * inert for screen readers, and locks background scrolling.
 */
export default function Modal({ open, onClose, title, footer, children, width }) {
  return (
    <MuiModal
      open={open}
      onClose={onClose}
      aria-labelledby="app-modal-title"
      slotProps={{ root: { className: 'modal-bg' } }}
    >
      <div className="modal" style={width ? { maxWidth: width } : undefined}>
        <div className="modal-h">
          <div className="modal-t" id="app-modal-title">
            {title}
          </div>
          <button type="button" className="modal-x" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal-b">{children}</div>
        {footer ? <div className="modal-f">{footer}</div> : null}
      </div>
    </MuiModal>
  );
}
