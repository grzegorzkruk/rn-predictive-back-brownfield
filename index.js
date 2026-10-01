import {AppRegistry} from 'react-native';
import RnScreenApp from './src/RnScreenApp';
import EmbedApp from './src/EmbedApp';
import {name as appName} from './app.json';

/**
 * One bundle, two appKeys. The native app mounts whichever it needs:
 *
 *   RNActivity         -> appName ("RNPredictiveBackBrownfield"), a full-screen RN screen
 *   NativeHostActivity -> "RNEmbed", inside a ReactNativeFragment
 *
 * Both come from this bundle and share one React Native instance, which is the point: the
 * back gesture has to survive going native -> React Native -> native-with-a-fragment.
 */
AppRegistry.registerComponent(appName, () => RnScreenApp);
AppRegistry.registerComponent('RNEmbed', () => EmbedApp);
