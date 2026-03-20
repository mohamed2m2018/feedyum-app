/**
 * Web shim for react-native-maps
 * Renders a placeholder div. Real web maps could use Google Maps JS API later.
 */
import React from 'react';
import { View, Text } from 'react-native';

const MapView = React.forwardRef(({ style, children, ...props }, ref) => (
  <View ref={ref} style={[{ backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' }, style]} {...props}>
    <Text style={{ color: '#888' }}>📍 Map (Web)</Text>
    {children}
  </View>
));
MapView.displayName = 'MapView';

export const Marker = ({ children }) => <>{children}</>;
export const Polyline = () => null;
export const Polygon = () => null;
export const Circle = () => null;
export const Callout = ({ children }) => <>{children}</>;
export const CalloutSubview = ({ children }) => <>{children}</>;
export const Overlay = () => null;
export const Heatmap = () => null;
export const Geojson = () => null;
export const PROVIDER_GOOGLE = 'google';
export const PROVIDER_DEFAULT = null;

export default MapView;
