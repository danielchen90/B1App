// Next Steps — /next-steps (replaces /connect, which now redirects here).
//
// Every "I want to..." from the home page, each with its own short login-free form
// that goes to the chosen worship center's admin inbox, labelled by type. Growth and
// partnership link out to the Global Training Center and Partners. The directory of
// center contacts closes the page for people who'd rather call.

import React from "react";
import type { Metadata } from "next";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { btSeo } from "@/components/public-bt/btSeo";
import { loadLocatorCampuses } from "@/helpers/LocatorCampusHelper";
import { loadBtConfig, toLocationLinks } from "../btPageData";
import { BtShell } from "@/components/public-bt/BtShell";
import { BtPageHead } from "@/components/public-bt/BtPageHead";
import { NextStepForm, type NextStepType } from "@/components/public-bt/forms/NextStepForm";
import { BT, BT_STEPS, BT_LINKS } from "@/components/public-bt/btSiteContent";
import { IconPhone, IconMail, IconArrowRight } from "@/components/public-bt/BtIcons";

type PageParams = { sdSlug: string };

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { sdSlug } = await params;
  const config = await loadBtConfig(sdSlug);
  const churchName = config.church?.name || BT.name;
  const title = "Next Steps | " + churchName;
  const description = "Plan a visit, request prayer, get baptized, join a discipleship class or serve at your " + churchName + " worship center. No account needed.";
  return btSeo(MetaHelper.getMetaData(title, description, description, config.appearance), "/next-steps");
}

interface StepCopy {
  type: NextStepType;
  body: string;
  cta: string;
  messageLabel?: string;
  messageRequired?: boolean;
  defaultMessage: string;
  thankYouTitle: string;
  thankYouCopy: string;
}

const STEP_COPY: Record<string, StepCopy> = {
  visit: {
    type: "visit",
    body: "Come as you are. A service at any of our worship centers is warm and unhurried: heartfelt worship, real prayer, and teaching that opens the Scriptures plainly. Bring your Bible and bring your questions. Tell us you're coming and someone will look out for you.",
    cta: "Plan my visit",
    messageLabel: "Anything we should know? (optional)",
    defaultMessage: "I'm planning a visit.",
    thankYouTitle: "We'll see you soon",
    thankYouCopy: "Thank you for letting us know. Someone from the center will be looking out for you."
  },
  prayer: {
    type: "prayer",
    body: BT.name + " ministers around the world pray over every request. Send in your prayer request and let us know your praise reports.",
    cta: "Send my prayer request",
    messageLabel: "Your prayer request or praise report",
    messageRequired: true,
    defaultMessage: "",
    thankYouTitle: "We're praying with you",
    thankYouCopy: "Thank you for sharing. Our prayer team has received your request and is lifting it up. You are not alone."
  },
  salvation: {
    type: "salvation",
    body: "If you want to give your life to Jesus, or you have questions about what that means, a minister would be glad to talk with you and pray with you.",
    cta: "Talk with a minister",
    defaultMessage: "I'd like to talk with someone about following Jesus.",
    thankYouTitle: "Heaven rejoices with you",
    thankYouCopy: "A minister will reach out to you soon."
  },
  baptism: {
    type: "baptism",
    body: "Water baptism is an outward declaration of what Christ has done within. Let your center know you'd like to be baptized and they'll walk you through it.",
    cta: "I want to be baptized",
    defaultMessage: "I'd like to be baptized.",
    thankYouTitle: "What a step",
    thankYouCopy: "Your center will contact you about the next baptism service."
  },
  discipleship: {
    type: "discipleship",
    body: "Beyond Sunday, every worship center gathers through the week for discipleship: smaller settings where the Word is studied deeply, questions are welcomed, and believers are trained for ministry. Classes meet in person and on Zoom.",
    cta: "Join a class",
    defaultMessage: "I'd like to join a discipleship class.",
    thankYouTitle: "Welcome to the class",
    thankYouCopy: "Your center will send you the class times and how to join."
  },
  serve: {
    type: "serve",
    body: "Every center runs on people who give their gifts: worship, hospitality, children, media, prayer, outreach. Tell us where you'd like to help.",
    cta: "I want to serve",
    messageLabel: "Where would you like to serve? (optional)",
    defaultMessage: "I'd like to serve.",
    thankYouTitle: "Thank you for offering",
    thankYouCopy: "A team leader from your center will be in touch."
  }
};

const CSS = `
.bt-ns-nav { position: sticky; top: 64px; z-index: 5; background: rgba(247,247,248,.94); backdrop-filter: blur(8px); border-bottom: 1px solid var(--bt-line); }
.bt-ns-nav-in { max-width: var(--bt-maxw); margin: 0 auto; padding: 10px 20px; display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; }
.bt-ns-nav-in::-webkit-scrollbar { display: none; }
.bt-ns-nav a { white-space: nowrap; }
.bt-ns { display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); gap: clamp(24px, 4vw, 56px); align-items: start; scroll-margin-top: 130px; }
@media (max-width: 860px) { .bt-ns { grid-template-columns: 1fr; } }
.bt-ns + .bt-ns { margin-top: 12px; padding-top: clamp(40px, 6vw, 64px); border-top: 1px solid var(--bt-line); }
.bt-dir { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
.bt-dir > div { background: var(--bt-paper); border: 1px solid var(--bt-line); border-radius: var(--bt-radius); padding: 14px 16px; display: grid; gap: 4px; font-size: .93rem; }
.bt-dir a { display: inline-flex; align-items: center; gap: 7px; color: var(--bt-body); word-break: break-all; }
.bt-dir a:hover { color: var(--bt-ink); }
`;

export default async function NextStepsPage({ params }: { params: Promise<PageParams> }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug } = await params;
  const config = await loadBtConfig(sdSlug);
  const churchId = config.church?.id || "";
  const centers = await loadLocatorCampuses(churchId);
  const options = centers.map((c) => ({ id: c.id, slug: c.slug, name: c.name, virtual: c.virtual }));
  const reachable = centers.filter((c) => c.phone || c.email);

  return (
    <BtShell config={config} campuses={toLocationLinks(centers)}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <BtPageHead
        eyebrow="Next steps"
        title="Wherever you are with God, there's a next step."
        lede="Plan a visit, ask for prayer, get baptized, join a class or serve. Each one goes straight to your worship center, and a real person reads every message. No account needed."
      />

      <nav className="bt-ns-nav" aria-label="Next steps">
        <div className="bt-ns-nav-in">
          {BT_STEPS.map((s) => (
            <a key={s.id} className="bt-chip" href={"#" + s.id}>{s.label}</a>
          ))}
        </div>
      </nav>

      <section className="bt-section">
        {BT_STEPS.filter((s) => STEP_COPY[s.id]).map((s) => {
          const c = STEP_COPY[s.id];
          return (
            <div key={s.id} id={s.id} className="bt-ns">
              <div>
                <h2 className="bt-h2">{s.label}</h2>
                <p className="bt-lede" style={{ marginTop: 12 }}>{c.body}</p>
              </div>
              <NextStepForm
                churchId={churchId}
                centers={options}
                type={c.type}
                cta={c.cta}
                messageLabel={c.messageLabel}
                messageRequired={c.messageRequired}
                defaultMessage={c.defaultMessage}
                thankYouTitle={c.thankYouTitle}
                thankYouCopy={c.thankYouCopy}
                collapsed={c.type !== "visit" && c.type !== "prayer"}
              />
            </div>
          );
        })}

        <div id="grow" className="bt-ns">
          <div>
            <h2 className="bt-h2">Grow and train</h2>
            <p className="bt-lede" style={{ marginTop: 12 }}>
              The Mary Banks Global Training Center has free courses with video lessons, and Growth Paths that lead you step by step, from new believer to trained minister.
            </p>
          </div>
          <div className="bt-card" style={{ padding: 22, display: "grid", gap: 12 }}>
            <p>Start with a Growth Path, or browse every course. It&rsquo;s free, and your Mary Banks ID signs you in.</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <a className="bt-btn" href={BT_LINKS.growthPaths}>See the Growth Paths</a>
              <a className="bt-btn bt-btn-outline" href={BT_LINKS.gtc}>All courses</a>
            </div>
          </div>
        </div>

        <div id="partner" className="bt-ns">
          <div>
            <h2 className="bt-h2">Become a partner</h2>
            <p className="bt-lede" style={{ marginTop: 12 }}>
              Partners keep the books, courses and teaching free for everyone, and carry them to the nations. Give monthly or once, as the Lord leads you.
            </p>
          </div>
          <div className="bt-card" style={{ padding: 22, display: "grid", gap: 12 }}>
            <p>Partnership is managed with your Mary Banks ID, so you can see and change your giving any time.</p>
            <div><a className="bt-btn" href={BT_LINKS.partners}>Partner with us <IconArrowRight size={16} /></a></div>
          </div>
        </div>
        <div id="contact" className="bt-ns">
          <div>
            <h2 className="bt-h2">Ask us a question</h2>
            <p className="bt-lede" style={{ marginTop: 12 }}>
              Questions about service times, getting involved, or anything else? Send your center a note and someone will get back to you.
            </p>
          </div>
          <NextStepForm
            churchId={churchId}
            centers={options}
            type="contact"
            cta="Send message"
            messageLabel="Your question"
            messageRequired
            defaultMessage=""
            thankYouTitle="Thank you"
            thankYouCopy="We've received your message and will get back to you soon."
            collapsed
          />
        </div>
      </section>

      {reachable.length > 0 && (
        <section className="bt-band">
          <div className="bt-section">
            <div className="bt-section-head">
              <div>
                <div className="bt-eyebrow">Reach your local team</div>
                <h2 className="bt-h2">Worship center contacts</h2>
              </div>
            </div>
            <div className="bt-dir">
              {reachable.map((c) => (
                <div key={c.id}>
                  <b style={{ color: "var(--bt-ink)" }}>{c.flag} {c.name}</b>
                  {c.phone && <a href={"tel:" + c.phone.replace(/[^+\d]/g, "")}><IconPhone size={15} /> {c.phone}</a>}
                  {c.email && <a href={"mailto:" + c.email}><IconMail size={15} /> {c.email}</a>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </BtShell>
  );
}
