import { Component, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/** Catches render errors anywhere below it, so one unexpected bug shows a recoverable
 * screen instead of a permanently blank/frozen app. Deliberately has no dependency on
 * anything else in the tree (no i18n, no theme, no database) — it has to keep working
 * even when whatever crashed was one of those, so its text is hardcoded rather than
 * pulled from the translation dictionary. */
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

    return (
      <View style={styles.screen}>
        <Text style={styles.title}>Er ging iets mis</Text>
        <Text style={styles.message}>{error.message || 'Onbekende fout.'}</Text>
        <Pressable style={styles.button} onPress={this.handleRetry}>
          <Text style={styles.buttonLabel}>Opnieuw proberen</Text>
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
