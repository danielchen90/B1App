import { ChatHelper } from "@/helpers/ChatHelper";
import { ChatSafetyHelper } from "@/helpers/ChatSafetyHelper";
import { StreamingServiceHelper } from "@/helpers/StreamingServiceHelper";
import { ChatConfigHelper } from "@/helpers/ChatConfigHelper";
import React from "react";
import { ChatUserInterface } from "../../../helpers";
import { Permissions } from "@churchapps/helpers";
import { ApiHelper, Locale } from "@churchapps/apphelper";
import { UserHelper } from "@churchapps/apphelper";
import type { MessageInterface } from "@churchapps/helpers";
import { Icon, Menu, MenuItem, Snackbar } from "@mui/material";
import { BlockPersonDialog, ReportMessageDialog } from "@/components/chatSafety/ChatSafetyDialogs";

interface Props { message: MessageInterface, conversationId: string, user: ChatUserInterface }

type SafeMessage = MessageInterface & { senderKey?: string };

export const ChatMessage: React.FC<Props> = (props) => {
  const message = props.message as SafeMessage;
  const [menuEl, setMenuEl] = React.useState<HTMLElement | null>(null);
  const [reportOpen, setReportOpen] = React.useState(false);
  const [blockOpen, setBlockOpen] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);

  const isHost = UserHelper.checkAccess(Permissions.contentApi.chat.host) || UserHelper.checkAccess(Permissions.contentApi.content.edit);
  const myPersonId = UserHelper.person?.id;
  const myName = `${ChatHelper.current.user?.firstName || ""} ${ChatHelper.current.user?.lastName || ""}`;
  const isMine = (!!myPersonId && message.personId === myPersonId) || (!message.personId && message.displayName === myName);
  const memberBlock = ChatSafetyHelper.isSignedIn() && !!message.personId;

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    ApiHelper.delete("/messages/" + props.message.id, "MessagingApi");
  };

  const getDeleteLink = () => {
    if (!UserHelper.checkAccess(Permissions.contentApi.chat.host)) return null;
    else {
      return <span className="delete"><a href="about:blank" onClick={handleDelete} data-testid="chat-delete-message-link"><Icon>delete</Icon></a></span>;
    }

  };

  const handleBlock = async () => {
    if (memberBlock) await ChatSafetyHelper.blockPerson(message.personId);
    ChatSafetyHelper.blockSenderLocally(message);
  };

  // Staff: keep this sender out of the rest of this stream (server-side, by their connection).
  const handleHostBlock = async () => {
    setMenuEl(null);
    try {
      await ApiHelper.post("/messages/blockSender", { messageId: message.id, serviceId: StreamingServiceHelper.currentService?.id }, "MessagingApi");
      setNotice(Locale.label("chatSafety.hostBlocked").replace("{}", message.displayName || ""));
    } catch {
      setNotice(Locale.label("chatSafety.hostBlockFailed"));
    }
  };

  const getActions = () => {
    if (isMine || !message.id) return null;
    return (
      <span className="delete">
        <a href="about:blank" onClick={(e) => { e.preventDefault(); setMenuEl(e.currentTarget); }} aria-label={Locale.label("chatSafety.messageOptions")} data-testid="chat-message-options">
          <Icon>more_vert</Icon>
        </a>
      </span>
    );
  };

  const className = (props.message.displayName.indexOf("Facebook") > -1) ? "message understate" : "message";
  return (
    <div className={className}>
      {getDeleteLink()}
      {getActions()}
      <b>{props.message.displayName}:</b> <span dangerouslySetInnerHTML={{ __html: ChatHelper.insertLinks(props.message.content) }}></span>
      <Menu anchorEl={menuEl} open={!!menuEl} onClose={() => setMenuEl(null)}>
        <MenuItem onClick={() => { setMenuEl(null); setReportOpen(true); }}>
          <Icon sx={{ fontSize: 18, mr: 1 }}>flag</Icon>{Locale.label("chatSafety.report")}
        </MenuItem>
        <MenuItem onClick={() => { setMenuEl(null); setBlockOpen(true); }}>
          <Icon sx={{ fontSize: 18, mr: 1 }}>block</Icon>{Locale.label("chatSafety.block")}
        </MenuItem>
        {isHost && (
          <MenuItem onClick={handleHostBlock}>
            <Icon sx={{ fontSize: 18, mr: 1 }}>gpp_bad</Icon>{Locale.label("chatSafety.hostBlock")}
          </MenuItem>
        )}
      </Menu>
      <ReportMessageDialog open={reportOpen} messageId={message.id} churchId={message.churchId || ChatConfigHelper.current?.churchId} onClose={() => setReportOpen(false)} />
      <BlockPersonDialog open={blockOpen} name={message.displayName} deviceOnly={!memberBlock} onConfirm={handleBlock} onClose={() => setBlockOpen(false)} />
      <Snackbar open={!!notice} autoHideDuration={4000} onClose={() => setNotice(null)} message={notice || ""} />
    </div>
  );
};
