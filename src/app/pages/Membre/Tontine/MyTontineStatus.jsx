// Import Dependencies
import { useState } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
} from "@heroicons/react/24/solid";

// Local Imports
import { formatMoney, levels } from "app/pages/Simulateur/data";
import { currentMember } from "../currentMember";
import { useMemberLevel } from "../context/MemberLevelContext";
import { loadMemberSpace } from "../memberStore";
import { joinWave, payContribution } from "api/tontine";
import { getMyNextPayment, getMyNextTurn, getWaveState } from "./tontineData";

// ----------------------------------------------------------------------

// "Mon suivi" : les 2 informations qu'un membre cherche en premier sur
// cette page (avant de regarder les 12 mois du groupe ou les autres
// membres) — QUAND je dois payer et si je suis à jour, et QUAND c'est
// mon tour de recevoir la cagnotte. Les deux cartes ci-dessous (voir
// mockData.js : "getMyNextPayment"/"getMyNextTurn") retrouvent le membre
// connecté dans le groupe de ce niveau — rien ici n'est calculé sur "tout
// le monde", contrairement à StatusLegend/TontineCycle/CotisationTracking
// plus bas qui concernent le groupe entier.
//
// Le reçu téléchargé par le bouton est un simple fichier HTML généré côté
// navigateur (aucun appel backend, aucun vrai document signé) : un
// placeholder pour que le bouton soit testable, à remplacer par un vrai
// reçu PDF une fois les paiements réellement branchés au backend.
function buildReceiptHtml({ memberName, levelName, amount, dateLabel, statusLabel, note }) {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Reçu de cotisation — DBC</title>
<style>
  body { font-family: -apple-system, Segoe UI, sans-serif; color: #111827; padding: 48px; }
  h1 { font-size: 18px; margin-bottom: 24px; }
  .row { margin: 10px 0; }
  .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #6b7280; }
  .value { font-size: 15px; font-weight: 600; }
  .note { margin-top: 40px; font-size: 11px; color: #9ca3af; }
</style>
</head>
<body>
  <h1>Reçu de cotisation — DBC</h1>
  <div class="row"><div class="label">Membre</div><div class="value">${memberName}</div></div>
  <div class="row"><div class="label">Niveau</div><div class="value">${levelName}</div></div>
  <div class="row"><div class="label">Montant</div><div class="value">${amount}</div></div>
  <div class="row"><div class="label">Échéance</div><div class="value">${dateLabel}</div></div>
  <div class="row"><div class="label">Statut</div><div class="value">${statusLabel}</div></div>
  <p class="note">${note}</p>
</body>
</html>`;
}

function downloadReceipt(payload) {
  const blob = new Blob([buildReceiptHtml(payload)], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "recu-cotisation-dbc.html";
  link.click();
  URL.revokeObjectURL(url);
}

// Message affiché sous les cartes après une action (paiement lancé, vague
// rejointe...) ou une erreur renvoyée par le serveur.
function ActionMessage({ message }) {
  if (!message) return null;
  return (
    <p
      role="status"
      className={clsx(
        "mt-3 rounded-lg px-4 py-3 text-sm font-medium",
        message.tone === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700",
      )}
    >
      {message.text}
    </p>
  );
}

// Le membre n'a pas encore de vague à ce niveau : il rejoint la plus récente
// (sa 1re cotisation, pour DBC, est aussitôt demandée), ou s'inscrit sur la
// liste d'attente de la prochaine. Déjà inscrit : on le lui rappelle.
function JoinWaveCard({ levelName, state }) {
  const { t, i18n } = useTranslation();
  const [busy, setBusy] = useState(null); // null | "join" | "wait"
  const [message, setMessage] = useState(null);
  const locale = i18n.language?.startsWith("fr") ? "fr-FR" : "en-US";

  const run = async (waitForNextWave) => {
    setBusy(waitForNextWave ? "wait" : "join");
    setMessage(null);
    try {
      const result = await joinWave({ levelCode: state.levelCode, waitForNextWave });
      if (result.outcome === "joined_wave") {
        setMessage({ tone: "success", text: t("membre.tontine.join.joined") });
      }
      await loadMemberSpace();
    } catch (error) {
      setMessage({ tone: "error", text: error.detail ?? t("membre.tontine.errors.generic") });
    } finally {
      setBusy(null);
    }
  };

  if (state.waitingList) {
    return (
      <div className="mt-8 rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#52A2DF]/[0.1] text-[#52A2DF]">
            <ClockIcon aria-hidden="true" className="size-5" />
          </span>
          <p className="text-sm font-bold text-gray-900">{t("membre.tontine.join.waitingTitle")}</p>
        </div>
        <p className="mt-3 text-sm text-gray-600">
          {t("membre.tontine.join.waiting", {
            level: levelName,
            date: new Date(state.waitingList.registeredAt).toLocaleDateString(locale),
          })}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#EE7115]/[0.1] text-[#EE7115]">
          <UserGroupIcon aria-hidden="true" className="size-5" />
        </span>
        <p className="text-sm font-bold text-gray-900">{t("membre.tontine.join.title", { level: levelName })}</p>
      </div>
      <p className="mt-3 text-sm text-gray-600">{t("membre.tontine.join.description")}</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => run(false)}
          disabled={busy !== null}
          className="flex items-center justify-center gap-2 rounded-lg bg-[#EE7115] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {busy === "join" && <ArrowPathIcon aria-hidden="true" className="size-4 animate-spin" />}
          {t("membre.tontine.join.join")}
        </button>
        <button
          type="button"
          onClick={() => run(true)}
          disabled={busy !== null}
          className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
        >
          {busy === "wait" && <ArrowPathIcon aria-hidden="true" className="size-4 animate-spin" />}
          {t("membre.tontine.join.wait")}
        </button>
      </div>
      <ActionMessage message={message} />
    </div>
  );
}

export function MyTontineStatus() {
  const { t, i18n } = useTranslation();
  const { activeLevelKey } = useMemberLevel();
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState(null);
  const waveState = getWaveState(activeLevelKey);
  const locale = i18n.language?.startsWith("fr") ? "fr-FR" : "en-US";
  const months = t("membre.common.months", { returnObjects: true });

  const payment = getMyNextPayment(activeLevelKey);
  const turn = getMyNextTurn(activeLevelKey);
  const level = levels.find((l) => l.key === activeLevelKey);
  const levelName = level ? t(`simulateur.levels.${level.key}.name`) : "";

  const dueDateLabel = `${payment.dueDate.date()} ${months[payment.dueDate.month()].toLowerCase()} ${payment.dueDate.year()}`;

  // Pas encore de vague à ce niveau (ou en liste d'attente) : rien à payer.
  if (!waveState.wave) {
    return <JoinWaveCard levelName={levelName} state={waveState} />;
  }

  // Lance le paiement Mobile Money de la prochaine cotisation ; la
  // confirmation du fournisseur met ensuite le suivi à jour (voir backend).
  const handlePay = async () => {
    setPaying(true);
    setMessage(null);
    try {
      await payContribution(waveState.levelCode);
      setMessage({ tone: "success", text: t("membre.tontine.myStatus.payment.payInitiated") });
      await loadMemberSpace();
    } catch (error) {
      setMessage({ tone: "error", text: error.detail ?? t("membre.tontine.errors.generic") });
    } finally {
      setPaying(false);
    }
  };

  const handleDownload = () => {
    downloadReceipt({
      memberName: currentMember.name,
      levelName,
      amount: formatMoney(payment.amount, locale),
      dateLabel: dueDateLabel,
      statusLabel: t(
        payment.isLate ? "membre.tontine.myStatus.payment.late" : "membre.tontine.myStatus.payment.onTime",
      ),
      note: t("membre.tontine.myStatus.payment.receiptNote"),
    });
  };

  return (
    <div className="mt-8">
      <h2 className="text-sm font-bold text-gray-900">{t("membre.tontine.myStatus.title")}</h2>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Mon prochain versement */}
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#52A2DF]/[0.1] text-[#52A2DF]">
                <CalendarDaysIcon aria-hidden="true" className="size-5" />
              </span>
              <p className="text-sm font-bold text-gray-900">
                {t("membre.tontine.myStatus.payment.title")}
              </p>
            </div>
            <span
              className={clsx(
                "flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold",
                payment.isLate ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700",
              )}
            >
              {payment.isLate ? (
                <ExclamationTriangleIcon aria-hidden="true" className="size-3.5" />
              ) : (
                <CheckCircleIcon aria-hidden="true" className="size-3.5" />
              )}
              {t(
                payment.isLate
                  ? "membre.tontine.myStatus.payment.late"
                  : "membre.tontine.myStatus.payment.onTime",
              )}
            </span>
          </div>

          <p className="mt-4 text-2xl font-black text-gray-900">
            {formatMoney(payment.amount, locale)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {payment.allPaid
              ? t("membre.tontine.myStatus.payment.allPaid")
              : t("membre.tontine.myStatus.payment.dueLabel", { date: dueDateLabel })}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {!payment.allPaid && (
              <button
                type="button"
                onClick={handlePay}
                disabled={paying}
                className="flex w-fit items-center gap-2 rounded-lg bg-[#EE7115] px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {paying ? (
                  <ArrowPathIcon aria-hidden="true" className="size-4 shrink-0 animate-spin" />
                ) : (
                  <BanknotesIcon aria-hidden="true" className="size-4 shrink-0" />
                )}
                {t(paying ? "membre.tontine.myStatus.payment.paying" : "membre.tontine.myStatus.payment.pay")}
              </button>
            )}
            <button
              type="button"
              onClick={handleDownload}
              className="flex w-fit items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100"
            >
              <ArrowDownTrayIcon aria-hidden="true" className="size-4 shrink-0" />
              {t("membre.tontine.myStatus.payment.downloadReceipt")}
            </button>
          </div>
        </div>

        {/* Mon tour */}
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#EE7115]/[0.1] text-[#EE7115]">
              <ClockIcon aria-hidden="true" className="size-5" />
            </span>
            <p className="text-sm font-bold text-gray-900">{t("membre.tontine.myStatus.turn.title")}</p>
          </div>

          {turn && (
            <p className="mt-4 text-sm font-semibold leading-snug text-gray-900">
              {turn.monthsAway === 0 && t("membre.tontine.myStatus.turn.thisMonth")}
              {turn.monthsAway === 1 && t("membre.tontine.myStatus.turn.nextMonth")}
              {turn.monthsAway > 1 &&
                t("membre.tontine.myStatus.turn.inMonths", { count: turn.monthsAway })}
              {turn.monthsAway < 0 &&
                t("membre.tontine.myStatus.turn.past", { tour: turn.tour })}
            </p>
          )}
        </div>
      </div>
      <ActionMessage message={message} />
    </div>
  );
}
