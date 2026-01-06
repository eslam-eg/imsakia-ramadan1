
import { ClientData } from '../types';

export const encodeClientData = (data: ClientData): string => {
  try {
    const json = JSON.stringify(data);
    return btoa(unescape(encodeURIComponent(json)));
  } catch (e) {
    return '';
  }
};

export const decodeClientData = (base64: string): ClientData | null => {
  try {
    const json = decodeURIComponent(escape(atob(base64)));
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
};

export const getClientFromURL = (): ClientData | null => {
  const params = new URLSearchParams(window.location.search);
  const data = params.get('d');
  if (data) return decodeClientData(data);
  return null;
};
