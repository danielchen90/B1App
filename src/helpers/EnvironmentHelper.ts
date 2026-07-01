import { ApiHelper } from "@churchapps/apphelper";
import { CommonEnvironmentHelper } from "@churchapps/apphelper";
import { Locale } from "@churchapps/apphelper";

export class EnvironmentHelper {
  static Common = CommonEnvironmentHelper;
  public static LessonsApi = "";
  public static LessonsUrl = "";
  static hasInit = false;
  static hasLocaleInit = false;
  static localeInitPromise: Promise<void> | null = null;

  static initServerSide = async () => {
    this.init();
    if (!this.hasLocaleInit) {
      if (!this.localeInitPromise) {
        this.localeInitPromise = this.initLocale().then(() => { this.hasLocaleInit = true; });
      }
      await this.localeInitPromise;
    }
  };

  static init = () => {
    if (this.hasInit) return;
    this.hasInit = true;
    const stage = process.env.NEXT_STAGE || process.env.NEXT_PUBLIC_STAGE;

    //stage = "prod"
    switch (stage) {
      case "staging": EnvironmentHelper.initStaging(); break;
      case "prod": EnvironmentHelper.initProd(); break;
      default: EnvironmentHelper.initDev(); break;
    }
    EnvironmentHelper.Common.init(stage);

    ApiHelper.apiConfigs = [
      { keyName: "MembershipApi", url: EnvironmentHelper.Common.MembershipApi, jwt: "", permissions: [] },
      { keyName: "AttendanceApi", url: EnvironmentHelper.Common.AttendanceApi, jwt: "", permissions: [] },
      { keyName: "MessagingApi", url: EnvironmentHelper.Common.MessagingApi, jwt: "", permissions: [] },
      { keyName: "ContentApi", url: EnvironmentHelper.Common.ContentApi, jwt: "", permissions: [] },
      { keyName: "GivingApi", url: EnvironmentHelper.Common.GivingApi, jwt: "", permissions: [] },
      { keyName: "DoingApi", url: EnvironmentHelper.Common.DoingApi, jwt: "", permissions: [] },
      { keyName: "LessonsApi", url: EnvironmentHelper.LessonsApi, jwt: "", permissions: [] },
      { keyName: "AskApi", url: EnvironmentHelper.Common.AskApi, jwt: "", permissions: [] }
    ];
  };

  static initLocale = async () => {
    // Locale JSON is served by this app itself from /public. Resolve a base URL that
    // actually resolves during SSR — never an external brand domain: a dead host here
    // crashes boot (unhandled rejection on Node 22). Browser: own origin. Server: the
    // Railway public domain, then localhost for dev.
    let baseUrl: string;
    if (typeof window !== "undefined") {
      baseUrl = window.location.origin;
    } else {
      // Server-side: fetch our own statically-served locale files over loopback. Do NOT
      // use RAILWAY_PUBLIC_DOMAIN — for a wildcard custom domain it is "*.huro.church",
      // an invalid host. The app always answers on 127.0.0.1:$PORT.
      const port = process.env.PORT || "3301";
      baseUrl = `http://127.0.0.1:${port}`;
    }
    try {
      await Locale.init([baseUrl + `/locales/{{lng}}.json?v=1`, baseUrl + `/apphelper/locales/{{lng}}.json`]);
    } catch (err) {
      // Never let locale loading take down the server — fall back to untranslated keys.
      console.error("Locale init failed (continuing with defaults):", err);
    }
  };

  static initDev = () => {
    this.initStaging();
    EnvironmentHelper.LessonsApi = process.env.REACT_APP_LESSONS_API || process.env.NEXT_PUBLIC_LESSONS_API || EnvironmentHelper.LessonsApi;
  };

  //NOTE: None of these values are secret.
  static initStaging = () => {
    EnvironmentHelper.LessonsApi = "https://api.staging.lessons.church";
    EnvironmentHelper.LessonsUrl = "https://staging.lessons.church";
  };

  //NOTE: None of these values are secret.
  static initProd = () => {
    EnvironmentHelper.Common.GoogleAnalyticsTag = "G-XYCPBKWXB5";
    EnvironmentHelper.LessonsApi = "https://api.lessons.church";
    EnvironmentHelper.LessonsUrl = "https://lessons.church";
  };

}
