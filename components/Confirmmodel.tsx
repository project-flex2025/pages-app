import React from "react";
import { Modal, Button } from "react-bootstrap";

interface DeleteConfirmModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  count: number;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  show,
  onClose,
  onConfirm,
  count,
}) => {
  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Delete Confirmation</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Are you sure you want to delete <strong>{count}</strong> selected note
        {count > 1 ? "s" : ""}?
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          Delete
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
