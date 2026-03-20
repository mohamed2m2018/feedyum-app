/** Web shim for react-native-webview */
import React from 'react';

const WebView = React.forwardRef(({ source, style, ...props }, ref) => {
  const uri = source?.uri || '';
  const html = source?.html || '';

  if (html) {
    return <iframe ref={ref} srcDoc={html} style={{ border: 'none', width: '100%', height: '100%', ...(style || {}) }} />;
  }
  return <iframe ref={ref} src={uri} style={{ border: 'none', width: '100%', height: '100%', ...(style || {}) }} />;
});
WebView.displayName = 'WebView';
export default WebView;
