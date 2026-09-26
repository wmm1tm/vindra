import { getLocales } from 'expo-localization';
import { Component, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

/** Eigen mini-woordenboek, op de taal van het toestel (getLocales): het foutscherm mag niet
 * afhangen van de i18n-context of de database, want juist die kunnen gecrasht zijn. */
const TEXTS = {
  nl: { title: 'Er ging iets mis', unknown: 'Onbekende fout.', retry: 'Opnieuw proberen' },
  en: { title: 'Something went wrong', unknown: 'Unknown error.', retry: 'Try again' },
  de: { title: 'Etwas ist schiefgelaufen', unknown: 'Unbekannter Fehler.', retry: 'Erneut versuchen' },
  es: { title: 'Algo salió mal', unknown: 'Error desconocido.', retry: 'Reintentar' },
  fr: { title: 'Un problème est survenu', unknown: 'Erreur inconnue.', retry: 'Réessayer' },
  pt: { title: 'Algo deu errado', unknown: 'Erro desconhecido.', retry: 'Tentar novamente' },
};

function errorTexts() {
  try {
    const code = getLocales()[0]?.languageCode;
    return code && code in TEXTS ? TEXTS[code as keyof typeof TEXTS] : TEXTS.en;
  } catch {
    return TEXTS.en;
  }
}

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/** Catches render errors anywhere below it, so one unexpected bug shows a recoverable
 * screen instead of a permanently blank/frozen app. Deliberately has no dependency on
 * anything else in the tree (no i18n, no theme, no database) — it has to keep working
 * even when whatever crashed was one of those, so its text comes from the small TEXTS
 * table above rather than the translation dictionary. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const text = errorTexts();

    return (
      <View style={styles.screen}>
        <Text style={styles.title}>{text.title}</Text>
        <Text style={styles.message}>{error.message || text.unknown}</Text>
        <Pressable style={styles.button} onPress={this.handleRetry}>
          <Text style={styles.buttonLabel}>{text.retry}</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#12171C',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  title: {
    color: '#F1EEE7',
    fontSize: 20,
    fontWeight: '700',
  },
  message: {
    color: '#AAB4B6',
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    marginTop: 8,
    backgroundColor: '#D6A866',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonLabel: {
    color: '#12171C',
    fontWeight: '600',
    fontSize: 14,
  },
});
