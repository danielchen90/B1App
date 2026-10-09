import { ApiHelper, UserHelper } from "@churchapps/apphelper";

// Chat safety (App Store guideline 1.2): report a message and block a person.
//
// Signed-in members block by person (stored on the server, so group chat and private
// messages are filtered there too). Livestream guests are anonymous, so a livestream block is
// kept on this device: the sender's key (a hash of their connection the server attaches to
// each message) plus their display name.

export type ReportReason = "offensive" | "harassment" | "spam" | "other";
export const REPORT_REASONS: ReportReason[] = ["offensive", "harassment", "spam", "other"];

interface LocalBlock { senderKey?: string; displayName?: string }
interface BlockableMessage { personId?: string; displayName?: string; senderKey?: string }

const LOCAL_KEY = "mb_chat_blocked_senders";
type Listener = () => void;

export class ChatSafetyHelper {
  private static memberBlocks: Set<string> = new Set();
  private static memberBlocksLoaded: Promise<void> | null = null;
  private static listeners: Set<Listener> = new Set();

  static subscribe(fn: Listener) {
    ChatSafetyHelper.listeners.add(fn);
    return () => { ChatSafetyHelper.listeners.delete(fn); };
  }

  private static emit() { ChatSafetyHelper.listeners.forEach((fn) => { try { fn(); } catch { /* ignore */ } }); }

  /** Send a report. Throws with the server's message on failure ("too_many" when rate limited). */
  static async report(messageId: string, reason: ReportReason, note: string, churchId?: string) {
    const body = { messageId, reason, note: note?.trim() || undefined, churchId };
    if (UserHelper.user) return ApiHelper.post("/messages/report", body, "MessagingApi");
    return ApiHelper.postAnonymous("/messages/report", body, "MessagingApi");
  }

  // ---- signed-in member blocks (server) ----

  static isSignedIn() { return !!(UserHelper.currentUserChurch?.jwt && UserHelper.person?.id); }

  static loadMemberBlocks(force = false): Promise<void> {
    if (!ChatSafetyHelper.isSignedIn()) return Promise.resolve();
    if (ChatSafetyHelper.memberBlocksLoaded && !force) return ChatSafetyHelper.memberBlocksLoaded;
    ChatSafetyHelper.memberBlocksLoaded = ApiHelper.get("/memberBlocks", "MessagingApi")
      .then((r: { blockedPersonIds?: string[] }) => {
        ChatSafetyHelper.memberBlocks = new Set(r?.blockedPersonIds || []);
        ChatSafetyHelper.emit();
      })
      .catch(() => { ChatSafetyHelper.memberBlocksLoaded = null; });
    return ChatSafetyHelper.memberBlocksLoaded;
  }

  static isPersonBlocked(personId?: string) { return !!personId && ChatSafetyHelper.memberBlocks.has(personId); }

  static async blockPerson(personId: string) {
    const r = await ApiHelper.post("/memberBlocks", { blockedPersonId: personId }, "MessagingApi");
    ChatSafetyHelper.memberBlocks = new Set(r?.blockedPersonIds || [...ChatSafetyHelper.memberBlocks, personId]);
    ChatSafetyHelper.emit();
  }

  static async unblockPerson(personId: string) {
    const r: any = await ApiHelper.delete("/memberBlocks/" + personId, "MessagingApi");
    const next = new Set(ChatSafetyHelper.memberBlocks);
    next.delete(personId);
    ChatSafetyHelper.memberBlocks = Array.isArray(r?.blockedPersonIds) ? new Set(r.blockedPersonIds) : next;
    ChatSafetyHelper.emit();
  }

  // ---- livestream blocks (this device) ----

  private static readLocal(): LocalBlock[] {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(window.localStorage.getItem(LOCAL_KEY) || "[]") || []; } catch { return []; }
  }

  static blockSenderLocally(m: BlockableMessage) {
    if (typeof window === "undefined") return;
    const list = ChatSafetyHelper.readLocal();
    list.push({ senderKey: m.senderKey || undefined, displayName: m.senderKey ? undefined : m.displayName });
    try { window.localStorage.setItem(LOCAL_KEY, JSON.stringify(list.slice(-200))); } catch { /* storage full or blocked */ }
    ChatSafetyHelper.emit();
  }

  /** TRUE when this viewer blocked the sender (on this device, or as a member). */
  static isMessageBlocked(m: BlockableMessage): boolean {
    if (ChatSafetyHelper.isPersonBlocked(m.personId)) return true;
    const list = ChatSafetyHelper.readLocal();
    return list.some((b) => (b.senderKey && b.senderKey === m.senderKey) || (!b.senderKey && b.displayName && b.displayName === m.displayName));
  }
}
