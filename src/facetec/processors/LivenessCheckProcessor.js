import { FaceTecConfig } from '../FaceTecConfig';

// Processor para el flujo 3D Liveness de FaceTec V10
export class LivenessCheckProcessor {
  constructor(sessionToken, FaceTecSDKInstance, onComplete) {
    this.success = false;
    this.FaceTecSDKInstance = FaceTecSDKInstance;
    this.onComplete = onComplete;
    this.sessionToken = sessionToken;
  }

  // Método V10: Requerido por FaceTec para procesar cada frame/inicialización
  onSessionRequest(sessionRequestBlob, sessionRequestCallback) {
    // Para probar SIN BACKEND, conectamos directo a la API de prueba de FaceTec:
    const request = new XMLHttpRequest();
    request.open("POST", "https://api.facetec.com/api/v4/biometrics/process-request");
    request.setRequestHeader("Content-Type", "application/json");
    request.setRequestHeader("X-Device-Key", FaceTecConfig.DeviceKeyIdentifier);
    
    if (window.FaceTecSDK && typeof window.FaceTecSDK.getTestingAPIHeader === 'function') {
      request.setRequestHeader("X-Testing-API-Header", window.FaceTecSDK.getTestingAPIHeader());
    }

    const payload = JSON.stringify({ requestBlob: sessionRequestBlob });

    request.onload = () => {
      if (request.status === 200) {
        try {
          const parsedResponse = JSON.parse(request.responseText);
          sessionRequestCallback.processResponse(parsedResponse.responseBlob);
        } catch (e) {
          sessionRequestCallback.abortOnCatastrophicError();
        }
      } else {
        sessionRequestCallback.abortOnCatastrophicError();
      }
    };

    request.onerror = () => sessionRequestCallback.abortOnCatastrophicError();
    request.upload.onprogress = (ev) => {
      sessionRequestCallback.updateProgress(ev.loaded / ev.total);
    };

    request.send(payload);
  }

  // Se llama cuando el usuario termina el flujo 3D y se procesó el resultado
  onFaceTecExit(faceTecSessionResult) {
    if (window.FaceTecSDK && faceTecSessionResult.status === window.FaceTecSDK.FaceTecSessionStatus.SessionCompleted) {
      this.success = true;
    }
    this.onComplete(this.success);
  }
}
