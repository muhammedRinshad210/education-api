import { FiAlertTriangle } from "react-icons/fi";
import { Modal } from "./Modal";

export function ConfirmDialog({
  open,
  title = "Confirm action",
  description = "This action cannot be undone.",
  confirmLabel = "Confirm",
  destructive = false,
  onConfirm,
  onClose,
}) {
  return (
    <Modal open={open} title={title} onClose={onClose} size="md">
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-600">
            <FiAlertTriangle />
          </div>
          <p className="text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <div className="flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-full border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-full px-4 py-2.5 text-sm font-semibold text-white ${
              destructive ? "bg-rose-600 hover:bg-rose-700" : "bg-brand-600 hover:bg-brand-700"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
