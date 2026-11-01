/**
 * AulaControl BLE capability boundary.
 *
 * Web Bluetooth device selection is not proof of proximity to a registered
 * classroom beacon. The previous prototype accepted every nearby device and
 * returned a fabricated RSSI value, which could create false attendance.
 *
 * Until a real beacon protocol (service UUID, characteristic, payload and
 * server-side validation) is configured for a school, this module fails
 * closed and never reports a successful attendance check-in.
 */

export interface BleScanResult {
  supported: boolean;
  success: boolean;
  deviceName?: string;
  deviceId?: string;
  rssi?: number;
  error?: string;
  diagnostic: string;
}

export function checkBleSupport(): {
  isSupported: boolean;
  platformReason: string;
} {
  if (typeof window === 'undefined') {
    return { isSupported: false, platformReason: 'Entorno Bluetooth no disponible.' };
  }

  const userAgent = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return {
      isSupported: false,
      platformReason: 'iOS no ofrece Web Bluetooth de forma compatible con este flujo.',
    };
  }

  if (!('bluetooth' in navigator)) {
    return {
      isSupported: false,
      platformReason: 'Este navegador no ofrece Web Bluetooth.',
    };
  }

  return {
    isSupported: true,
    platformReason: 'El navegador ofrece Web Bluetooth; falta configurar y validar el protocolo del beacon escolar.',
  };
}

/**
 * Deliberately fail closed: choosing an arbitrary Bluetooth device is not
 * evidence that a student is in the assigned classroom.
 */
export async function requestClassroomBleDevice(
  _expectedBeaconUuid: string,
  classroomName: string
): Promise<BleScanResult> {
  const support = checkBleSupport();
  return {
    supported: support.isSupported,
    success: false,
    error: 'BLE_BEACON_PROTOCOL_NOT_CONFIGURED',
    diagnostic: `La validación BLE de ${classroomName || 'esta aula'} no está habilitada. ${support.platformReason} No se registró asistencia.`,
  };
}
