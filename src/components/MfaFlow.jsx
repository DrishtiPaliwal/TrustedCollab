import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import MfaMethodSetup from "@/components/MfaMethodSetup";
import { CodeField, MfaHeader, MfaNotice, RememberDevice, ResendLine, useAppInfo, useCooldown } from "@/components/MfaParts";
import { finishSignIn, mfaSession } from "@/lib/authMfaFlow";

const SMS_RESEND_SECONDS = 60;

/** @typedef {"totp" | "sms"} MfaMethod */

/** @typedef {Object} AppInfo
 * @property {string} [name]
 */

/** @typedef {Object} MfaFinishResult
 * @property {string} [access_token]
 * @property {string} [mfa_management_token]
 */

/** @typedef {Object} MfaSession
 * @property {() => Promise<void>} sendSignInCode
 * @property {(value: string, method: MfaMethod, remember: boolean) => Promise<MfaFinishResult>} verify
 * @property {(...args: any[]) => Promise<any>} setupAuthenticator
 * @property {(...args: any[]) => Promise<any>} sendPhoneCode
 * @property {(...args: any[]) => Promise<any>} confirmAuthenticator
 * @property {(...args: any[]) => Promise<any>} confirmPhone
 */

/** @typedef {Object} MfaChallenge
 * @property {string} mfa_session_token
 * @property {MfaMethod[]} [mfa_methods]
 * @property {string} [phone_hint]
 * @property {"enroll" | "verify"} [next_step]
 */

/** @typedef {Object} MfaFlowProps
 * @property {MfaChallenge} challenge
 * @property {string} [returnTo]
 * @property {(session: MfaSession) => void} [onManage]
 */

/** @typedef {Object} EnrollProps
 * @property {MfaSession} session
 * @property {(result: MfaFinishResult) => void} onDone
 */

/** @typedef {Object} VerifyProps
 * @property {MfaSession} session
 * @property {MfaChallenge} challenge
 * @property {string} [returnTo]
 * @property {(result: MfaFinishResult) => void} onDone
 */

// The second sign-in step, for a sign-in that returned mfa_required. It is card content: a page
// shows it with `return <MfaScreen><MfaFlow ... /></MfaScreen>` in place of its own layout.
// session-record-block keeps the QR code, setup key and codes out of session recordings.
// onManage(session) is called instead of finishing when the sign-in was for managing factors.
/** @param {MfaFlowProps} props */
export default function MfaFlow({ challenge, returnTo, onManage }) {
  const session = /** @type {MfaSession} */ (useMemo(() => mfaSession(challenge), [challenge]));
  /** @param {MfaFinishResult} result */
  const finish = (result) => {
    if (result.mfa_management_token && onManage) onManage(session);
    else if (result.access_token) finishSignIn(result.access_token, returnTo || "/");
  };
  return (
    <div className="session-record-block">
      {challenge.next_step === "enroll"
        ? <Enroll session={session} onDone={finish} />
        : <Verify session={session} challenge={challenge} returnTo={returnTo} onDone={finish} />}
    </div>
  );
}

/** @param {EnrollProps} props */
function Enroll({ session, onDone }) {
  const [method, setMethod] = useState(/** @type {MfaMethod | null} */ (null));
  const info = /** @type {AppInfo | null | undefined} */ (useAppInfo());
  return (
    <>
      <MfaHeader
        title={info ? `${info.name || "This app"} requires multi-factor authentication` : null}
        description={method ? null : "Add a second sign-in step to keep your account secure. Choose how you want to get your codes."}
      />
      {method ? (
        <MfaMethodSetup session={session} method={method} onDone={(result) => onDone(/** @type {MfaFinishResult} */ (result))} onBack={() => setMethod(null)} signInPath="/login" />
      ) : (
        <div className="space-y-3">
          <Button className="w-full h-12 font-medium" onClick={() => setMethod("totp")}>Set up your authenticator app</Button>
          <Button variant="outline" className="w-full h-12 font-medium" onClick={() => setMethod("sms")}>Enter your phone number</Button>
        </div>
      )}
    </>
  );
}

/** @param {VerifyProps} props */
function Verify({ session, challenge, returnTo, onDone }) {
  const methods = /** @type {MfaMethod[]} */ (challenge.mfa_methods);
  const [method, setMethod] = useState(/** @type {MfaMethod} */ (methods.includes("totp") ? "totp" : "sms"));
  const [code, setCode] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState(/** @type {any} */ (null));
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = /** @type {[number, (seconds: number) => void]} */ (useCooldown());
  const sent = useRef(false);
  const phone = /** @type {string} */ (challenge.phone_hint || "your phone");

  const sendCode = async () => {
    setError(null);
    setSending(true);
    try {
      await session.sendSignInCode();
      setCooldown(SMS_RESEND_SECONDS);
    } catch (err) {
      setError(/** @type {any} */ (err));
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    // Text the code once when SMS is the method in use; resending is the user's call.
    if (method !== "sms" || sent.current) return;
    sent.current = true;
    sendCode();
  }, [method]);

  /** @param {string} [value] */
  const verify = async (value = code) => {
    if (busy || value.length < 6) return;
    setError(null);
    setBusy(true);
    try {
      onDone(await session.verify(value, method, remember));
    } catch (err) {
      setError(/** @type {any} */ (err));
      setCode("");
      setBusy(false);
    }
  };

  const other = /** @type {MfaMethod | undefined} */ (methods.find((value) => value !== method));
  return (
    <>
      <MfaHeader title="Verify your identity" description={null} />
      <div className="space-y-4">
        <MfaNotice error={error} />
        <p className="text-sm text-muted-foreground text-center">
          {method === "totp" ? "Enter the code from your authenticator app"
            : sending && !cooldown ? `Sending code to ${phone}…` : `Enter the code sent to ${phone}`}
        </p>
        <CodeField id="mfa-code" value={code} onChange={setCode} onComplete={verify} />
        <RememberDevice checked={remember} onChange={setRemember} />
        <Button className="w-full h-12 font-medium" disabled={busy || code.length < 6} onClick={() => verify()}>
          {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {busy ? "Verifying..." : "Verify"}
        </Button>
        {method === "sms" && <ResendLine cooldown={cooldown} disabled={sending} onResend={sendCode} error={error} />}
        {other && (
          <Button variant="outline" className="w-full" onClick={() => { setMethod(other); setCode(""); setError(null); }}>
            {other === "sms" ? "Verify via Text Message" : "Verify via Authenticator App"}
          </Button>
        )}
        <div className="text-center">
          <a href={returnTo && returnTo !== "/" ? "/login?returnTo=" + encodeURIComponent(returnTo) : "/login"} className="text-sm text-muted-foreground hover:underline">Back to Login</a>
        </div>
      </div>
    </>
  );
}
