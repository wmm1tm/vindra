import { Button, HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  background,
  buttonStyle,
  containerBackground,
  font,
  foregroundStyle,
  frame,
  monospacedDigit,
  padding,
  shapes,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

/** Eén knop op de widget. `symbol` is een SF Symbol (de widget draait in een aparte
 * iOS-runtime die alleen SwiftUI-onderdelen kent, dus niet onze eigen iconen).
 * `sleep` = de slaapknop: die start of stopt een slaap i.p.v. een moment te loggen;
 * `since` is dan het starttijdstip (ms) van de lopende slaap, of 0 als er geen loopt.
 * Bewust nergens null in deze props: iOS kan null niet opslaan in de gedeelde App Group,
 * waardoor de hele update niet aankomt en de widget zwart blijft. */
export interface QuickLogButton {
  id: string;
  label: string;
  symbol: string;
  color: string;
  count: number;
  sleep?: boolean;
  since?: number;
}

/** Een tik op de widget die de app nog niet heeft verwerkt: type + tijdstip (ms), en voor
 * de slaapknop of het een start of een stop was. */
export interface PendingLog {
  k: string;
  t: number;
  a?: 'start' | 'stop';
}

export interface QuickLogProps {
  title: string;
  totalLabel: string;
  total: number;
  buttons: QuickLogButton[];
  pending: PendingLog[];
  /** Tekst op de slaapknop als er geen slaap loopt, en het voorvoegsel als die wel loopt. */
  sleepStartLabel: string;
  sleepSinceLabel: string;
  use12h: boolean;
  /** Getoond onder de knoppen zonder abonnement (alleen gedrag is dan gratis). */
  lockedHint: string;
}

/** Snel loggen vanaf het beginscherm. Deze functie wordt als tekst naar de widget-extensie
 * gestuurd en draait daar los van de app: alleen props en `environment`, geen hooks, geen
 * imports van eigen code, geen constanten van buiten deze functie.
 *
 * Een tik voegt het type + tijdstip toe aan `pending` en werkt de knop meteen bij. iOS
 * bewaart die nieuwe props in de gedeelde App Group, ook als de app dicht is;
 * lib/widget-sync.ts leest `pending` bij het openen van de app uit en zet ze op volgorde als
 * echte events in de database. */
const QuickLogWidget = (props: QuickLogProps, environment: WidgetEnvironment) => {
  'widget';
  // Nog geen gegevens van de app (net toegevoegd, app nog niet geopend): alleen de naam.
  // Zonder deze check faalt de functie en toont iOS een leeg, zwart vlak.
  if (!props || !props.buttons) {
    return (
      <VStack modifiers={[containerBackground('#12171C', 'widget')]}>
        <Text modifiers={[font({ size: 15, weight: 'heavy', design: 'rounded' }), foregroundStyle('#D6A866')]}>
          Vindra
        </Text>
      </VStack>
    );
  }
  const isSmall = environment.widgetFamily === 'systemSmall';
  const buttons = props.buttons.slice(0, 4);

  const formatClock = (ms: number) => {
    const date = new Date(ms);
    const minutes = String(date.getMinutes()).padStart(2, '0');
    if (!props.use12h) return `${String(date.getHours()).padStart(2, '0')}:${minutes}`;
    const hours = date.getHours() % 12 === 0 ? 12 : date.getHours() % 12;
    return `${hours}:${minutes} ${date.getHours() < 12 ? 'AM' : 'PM'}`;
  };

  const press = (button: QuickLogButton) => {
    const now = Date.now();
    if (button.sleep) {
      const running = Boolean(button.since);
      return {
        pending: [...(props.pending || []), { k: button.id, t: now, a: running ? 'stop' : 'start' }],
        buttons: props.buttons.map((b) =>
          // Teller +1 bij de START, net als de app (die telt gestarte slapen in het dagvenster).
          b.id === button.id ? { ...b, since: running ? 0 : now, count: running ? b.count : b.count + 1 } : b
        ),
      };
    }
    return {
      pending: [...(props.pending || []), { k: button.id, t: now }],
      total: props.total + 1,
      buttons: props.buttons.map((b) => (b.id === button.id ? { ...b, count: b.count + 1 } : b)),
    };
  };

  const renderButton = (button: QuickLogButton) => {
    const running = Boolean(button.sleep && button.since);
    const valueText = button.sleep
      ? running
        ? `${props.sleepSinceLabel} ${formatClock(button.since as number)}`
        : props.sleepStartLabel
      : String(button.count);
    return (
      <Button key={button.id} target={button.id} onPress={() => press(button)} modifiers={[buttonStyle('plain')]}>
        <VStack
          spacing={isSmall ? 2 : 4}
          modifiers={[
            frame({ maxWidth: 1000, maxHeight: 1000 }),
            padding({ vertical: isSmall ? 4 : 8 }),
            background(button.color + (running ? '66' : '2E'), shapes.roundedRectangle({ cornerRadius: 14 })),
          ]}>
          <Image systemName={button.symbol as never} size={isSmall ? 18 : 22} color={button.color} />
          {!isSmall && (
            <Text modifiers={[font({ size: 11, weight: 'semibold', design: 'rounded' }), foregroundStyle('#F1EEE7')]}>
              {button.label}
            </Text>
          )}
          <Text
            modifiers={[
              font({ size: button.sleep ? (isSmall ? 10 : 12) : isSmall ? 13 : 15, weight: 'heavy', design: 'rounded' }),
              monospacedDigit(),
              foregroundStyle(button.color),
            ]}>
            {valueText}
          </Text>
        </VStack>
      </Button>
    );
  };

  return (
    <VStack spacing={8} modifiers={[containerBackground('#12171C', 'widget')]}>
      <HStack>
        <Text modifiers={[font({ size: 15, weight: 'heavy', design: 'rounded' }), foregroundStyle('#D6A866')]}>
          {props.title}
        </Text>
        <Spacer />
        <Text modifiers={[font({ size: 12, weight: 'medium', design: 'rounded' }), foregroundStyle('#AAB4B6')]}>
          {`${props.total} ${props.totalLabel}`}
        </Text>
      </HStack>
      {isSmall ? (
        <VStack spacing={6}>
          <HStack spacing={6}>{buttons.slice(0, 2).map(renderButton)}</HStack>
          {buttons.length > 2 && <HStack spacing={6}>{buttons.slice(2, 4).map(renderButton)}</HStack>}
        </VStack>
      ) : (
        <HStack spacing={8}>{buttons.map(renderButton)}</HStack>
      )}
      {props.lockedHint ? (
        <Text modifiers={[font({ size: 10, weight: 'medium', design: 'rounded' }), foregroundStyle('#AAB4B6')]}>
          {props.lockedHint}
        </Text>
      ) : null}
    </VStack>
  );
};

export const QuickLog = createWidget<QuickLogProps>('QuickLog', QuickLogWidget);
