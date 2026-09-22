import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSQLiteContext } from 'expo-sqlite';

import { PaywallScreen } from '@/components/paywall/paywall-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { enableSync, linkSharedChild, type Child, type SharedChildPayload } from '@/db/child';
import { getAllEvents } from '@/db/events';
import { useActiveChild } from '@/lib/active-child-context';
import { useI18n } from '@/lib/i18n';
import { usePurchases } from '@/lib/purchases-context';
import { isSyncConfigured } from '@/lib/supabase';
import { pullChanges, pushAllLocal } from '@/lib/sync';

const QR_PAYLOAD_VERSION = 1;

interface ShareModeProps {
  mode: 'share';
  child: Child;
  onClose: () => void;
  onLinked?: never;
}

interface LinkModeProps {
  mode: 'link';
  child?: never;
  onClose: () => void;
  /** Ná een succesvolle koppeling is er een nieuw lokaal kind bijgekomen — de ouder
   * ("Kinderen beheren") moet dan zijn lijst verversen. */
  onLinked: () => void;
}

type ChildShareSheetProps = ShareModeProps | LinkModeProps;

function ShareView({ child }: { child: Child }) {
  const db = useSQLiteContext();
  const { t } = useI18n();
  const [qrValue, setQrValue] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  // react-native-qrcode-svg exposes the underlying SVG node here, which is what
  // toDataURL needs to rasterize the code for the PDF export below.
  const qrRef = useRef<{ toDataURL: (callback: (base64: string) => void) => void } | null>(null);

  const handleSaveAsPdf = () => {
    if (!qrRef.current) return;
    setExporting(true);
    qrRef.current.toDataURL(async (base64) => {
      try {
        const html = `<html><head><meta charset="utf-8" /></head>
          <body style="font-family: -apple-system, sans-serif; padding: 32px; color: #12171C; text-align: center;">
            <h1>${child.name}</h1>
            <p style="color:#555;">${t.childShare.backupHint}</p>
            <img src="data:image/png;base64,${base64}" width="240" height="240" />
          </body></html>`;
        const { uri } = await Print.printToFileAsync({ html });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
        }
      } finally {
        setExporting(false);
      }
    });
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { syncId, syncKey } = await enableSync(db, child.id);
      const payload: SharedChildPayload & { v: number } = {
        v: QR_PAYLOAD_VERSION,
        name: child.name,
        birthDate: child.birthDate,
        syncId,
        syncKey,
      };
      if (cancelled) return;
      setQrValue(JSON.stringify(payload));
      // Zorg dat de partner bij het scannen meteen de volledige geschiedenis binnenkrijgt,
      // niet alleen wat er ná dit moment nog bijkomt.
      const events = await getAllEvents(db, child.id);
      await pushAllLocal(db, child.id, events);
    })();
    return () => {
      cancelled = true;
    };
  }, [db, child.id, child.name, child.birthDate]);

  return (
    <View style={styles.content}>
      <Text style={styles.hint}>{t.childShare.shareHint}</Text>
      {qrValue ? (
        <View style={styles.qrWrapper}>
          <QRCode value={qrValue} size={200} backgroundColor="#F1EEE7" getRef={(ref) => (qrRef.current = ref)} />
        </View>
      ) : (
        <View style={styles.qrPlaceholder} />
      )}
      <Text style={styles.hint}>{t.childShare.backupHint}</Text>
      {/* Always rendered (never conditional on qrValue) — the button used to only appear
          once the QR code finished loading, so the sheet's Sluiten-link below it would
          jump down a moment after opening. Disabled + dimmed instead, until then. */}
      <PrimaryButton
        label={t.childShare.saveAsPdf}
        onPress={handleSaveAsPdf}
        disabled={!qrValue || exporting}
        loading={exporting}
      />
    </View>
  );
}

function LinkView({ onLinked }: { onLinked: () => void }) {
  const db = useSQLiteContext();
  const { t } = useI18n();
  const { setChildId } = useActiveChild();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [linkStatus, setLinkStatus] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScanned = async (data: string) => {
    if (scanned) return;
    setScanned(true);

    // Twee losse pogingen i.p.v. één catch-all: een kapotte/ongeldige QR-code en een
    // netwerkfout (bv. even geen internet tijdens het koppelen) zijn heel verschillende
    // problemen met een heel verschillende oplossing (opnieuw scannen vs. even wachten
    // op verbinding) — één generieke foutmelding voor allebei gaf de gebruiker geen
    // signaal welke van de twee het was.
    let payload: (SharedChildPayload & { v: number }) | null = null;
    try {
      const parsed = JSON.parse(data) as SharedChildPayload & { v: number };
      if (!parsed.syncId || !parsed.syncKey || !parsed.name) throw new Error('invalid payload');
      payload = parsed;
    } catch {
      setLinkStatus({ ok: false, message: t.childShare.linkError });
      return;
    }

    try {
      const newChildId = await linkSharedChild(db, payload);
      setLinkStatus({ ok: true, message: t.childShare.linkSuccess(payload.name) });
      await setChildId(newChildId);
      await pullChanges(db, newChildId);
      onLinked();
    } catch {
      setLinkStatus({ ok: false, message: t.childShare.linkNetworkError });
    }
  };

  return (
    <View style={styles.content}>
      <Text style={styles.hint}>{t.childShare.linkHint}</Text>
      {!permission?.granted ? (
        <View style={styles.permissionBox}>
          <Text style={styles.hint}>{t.childShare.cameraPermissionHint}</Text>
          <PrimaryButton label={t.childShare.grantPermission} onPress={requestPermission} />
        </View>
      ) : (
        <View style={styles.cameraWrapper}>
          <CameraView
            style={StyleSheet.absoluteFill}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={scanned ? undefined : (result) => handleScanned(result.data)}
          />
        </View>
      )}
      {linkStatus && (
        <Text style={[styles.hint, linkStatus.ok ? styles.linkSuccess : styles.linkErrorText]}>
          {linkStatus.message}
        </Text>
      )}
      {scanned && !linkStatus?.ok && (
        <PrimaryButton
          label={t.childShare.scanAgain}
          onPress={() => {
            setScanned(false);
            setLinkStatus(null);
          }}
        />
      )}
    </View>
  );
}

export function ChildShareSheet(props: ChildShareSheetProps) {
  const { t } = useI18n();
  const { mode, onClose } = props;
  const { status: purchasesStatus } = usePurchases();

  // Partner-sync is een premium-feature — net als bij de PDF-export en de niet-gratis
  // wiel-knoppen (zie WheelArc/DayReportSheet), maar hier géén los <Modal> bovenop de
  // paywall: zie de toelichting bij de return hieronder over waarom dit scherm zelf al
  // geen eigen <Modal> gebruikt. Absoluut gepositioneerd, niet als los Modal-venster.
  if (purchasesStatus !== 'entitled') {
    return (
      <View style={[StyleSheet.absoluteFill, styles.backdropNested]}>
        <PaywallScreen onClose={onClose} />
      </View>
    );
  }

  // Geen eigen <Modal>: dit scherm wordt altijd geopend vanuit ChildrenSettingsSheet,
  // die zelf al als geneste, modal-loze overlay rendert (zie SettingsSheetShell's
  // `nested`) — een tweede echte RN <Modal> daarbovenop stapelen is onbetrouwbaar
  // (vooral op iOS kan die dan stil niet verschijnen). Een gewone, absoluut gepositioneerde
  // laag geeft hetzelfde beeld zonder dat risico.
  return (
    <Pressable style={[styles.backdrop, styles.backdropNested]} onPress={onClose}>
      <Pressable style={styles.card} onPress={() => {}}>
        <Text style={styles.title}>{mode === 'share' ? t.childShare.shareTab : t.childShare.linkTab}</Text>

        {!isSyncConfigured && <Text style={styles.warning}>{t.childShare.notConfigured}</Text>}
        {isSyncConfigured && mode === 'share' && <ShareView child={props.child} />}
        {isSyncConfigured && mode === 'link' && <LinkView onLinked={props.onLinked} />}

        <View style={styles.actionsRow}>
          <Pressable onPress={onClose}>
            <Text style={styles.closeLabel}>{t.common.close}</Text>
          </Pressable>
        </View>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdropNested: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    width: 300,
    backgroundColor: '#1C252A',
    borderRadius: 16,
    padding: 18,
    gap: 10,
  },
  title: {
    color: '#F1EEE7',
    fontSize: 18,
    fontWeight: '700',
  },
  warning: {
    color: '#C97B7B',
    fontSize: 13,
  },
  hint: {
    color: '#AAB4B6',
    fontSize: 12,
  },
  content: {
    alignItems: 'center',
    gap: 12,
  },
  qrWrapper: {
    padding: 12,
    backgroundColor: '#F1EEE7',
    borderRadius: 12,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#12171C',
  },
  permissionBox: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  cameraWrapper: {
    width: '100%',
    height: 240,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  linkSuccess: {
    color: '#7FA37A',
  },
  linkErrorText: {
    color: '#C97B7B',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  closeLabel: {
    color: '#AAB4B6',
    fontSize: 14,
  },
});
