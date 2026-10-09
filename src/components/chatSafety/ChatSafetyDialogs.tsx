"use client";

import React from "react";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControlLabel, Radio, RadioGroup, TextField } from "@mui/material";
import { Locale } from "@churchapps/apphelper";
import { ChatSafetyHelper, REPORT_REASONS, type ReportReason } from "@/helpers/ChatSafetyHelper";

// Report and Block dialogs shared by livestream chat, group chat and private messages
// (App Store guideline 1.2).

interface ReportProps {
  open: boolean;
  messageId?: string;
  churchId?: string;
  onClose: () => void;
}

export const ReportMessageDialog: React.FC<ReportProps> = ({ open, messageId, churchId, onClose }) => {
  const [reason, setReason] = React.useState<ReportReason>("offensive");
  const [note, setNote] = React.useState("");
  const [state, setState] = React.useState<"idle" | "sending" | "sent" | "error" | "limited">("idle");

  React.useEffect(() => {
    if (open) { setReason("offensive"); setNote(""); setState("idle"); }
  }, [open, messageId]);

  const submit = async () => {
    if (!messageId) return;
    if (reason === "other" && !note.trim()) return;
    setState("sending");
    try {
      await ChatSafetyHelper.report(messageId, reason, note, churchId);
      setState("sent");
    } catch (e: any) {
      setState(String(e?.message || "").includes("too_many") ? "limited" : "error");
    }
  };

  const labelFor = (r: ReportReason) => Locale.label("chatSafety.reason." + r);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{Locale.label("chatSafety.reportTitle")}</DialogTitle>
      <DialogContent>
        {state === "sent" ? (
          <DialogContentText>{Locale.label("chatSafety.reportThanks")}</DialogContentText>
        ) : (
          <>
            <DialogContentText sx={{ mb: 1 }}>{Locale.label("chatSafety.reportPrompt")}</DialogContentText>
            <RadioGroup value={reason} onChange={(e) => setReason(e.target.value as ReportReason)}>
              {REPORT_REASONS.map((r) => (
                <FormControlLabel key={r} value={r} control={<Radio size="small" />} label={labelFor(r)} />
              ))}
            </RadioGroup>
            <TextField
              fullWidth
              size="small"
              multiline
              minRows={2}
              inputProps={{ maxLength: 1000 }}
              label={reason === "other" ? Locale.label("chatSafety.noteRequired") : Locale.label("chatSafety.noteOptional")}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              sx={{ mt: 1 }}
            />
            {state === "error" && <Alert severity="error" sx={{ mt: 1 }}>{Locale.label("chatSafety.reportFailed")}</Alert>}
            {state === "limited" && <Alert severity="warning" sx={{ mt: 1 }}>{Locale.label("chatSafety.reportLimited")}</Alert>}
          </>
        )}
      </DialogContent>
      <DialogActions>
        {state === "sent" ? (
          <Button onClick={onClose}>{Locale.label("chatSafety.close")}</Button>
        ) : (
          <>
            <Button onClick={onClose}>{Locale.label("chatSafety.cancel")}</Button>
            <Button
              onClick={submit}
              color="error"
              variant="contained"
              disabled={state === "sending" || (reason === "other" && !note.trim())}
              data-testid="chat-report-submit"
            >
              {Locale.label("chatSafety.report")}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

interface BlockProps {
  open: boolean;
  name?: string;
  /** Livestream guests: the block lives on this device only. */
  deviceOnly?: boolean;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}

export const BlockPersonDialog: React.FC<BlockProps> = ({ open, name, deviceOnly, onConfirm, onClose }) => {
  const [busy, setBusy] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => { if (open) { setBusy(false); setFailed(false); } }, [open]);

  const confirm = async () => {
    setBusy(true);
    setFailed(false);
    try {
      await onConfirm();
      onClose();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  const who = name || Locale.label("chatSafety.thisPerson");
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{Locale.label("chatSafety.blockTitle").replace("{}", who)}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {deviceOnly ? Locale.label("chatSafety.blockExplainDevice") : Locale.label("chatSafety.blockExplain")}
        </DialogContentText>
        {failed && <Alert severity="error" sx={{ mt: 1 }}>{Locale.label("chatSafety.blockFailed")}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{Locale.label("chatSafety.cancel")}</Button>
        <Button onClick={confirm} color="error" variant="contained" disabled={busy} data-testid="chat-block-confirm">
          {Locale.label("chatSafety.block")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
