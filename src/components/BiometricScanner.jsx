import { useEffect, useState, useRef } from 'react';
import { FaceTecConfig } from '../facetec/FaceTecConfig';
import { LivenessCheckProcessor } from '../facetec/processors/LivenessCheckProcessor';

export default function BiometricScanner({ onVerify }) {
  const [statusMessage, setStatusMessage] = useState('Cargando SDK de FaceTec...');
  const [isInitializing, setIsInitializing] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    let script = document.getElementById('facetec-sdk-script');
    
    const initializeFaceTec = () => {
      if (!window.FaceTecSDK) {
        setStatusMessage('Error: No se encontró FaceTecSDK en la ventana.');
        return;
      }
      
      const FaceTecSDK = window.FaceTecSDK;
      
      // Set the path to the directory containing FaceTec resources
      FaceTecSDK.setResourceDirectory('/facetec/core-sdk/FaceTecSDK.js/resources');
      FaceTecSDK.setImagesDirectory('/facetec/core-sdk/FaceTec_images');

      setStatusMessage('Inicializando FaceTec...');
      
      const mockSessionToken = "mock_token_123";
      
      FaceTecSDK.initializeWithSessionRequest(FaceTecConfig.DeviceKeyIdentifier, new LivenessCheckProcessor(mockSessionToken, FaceTecSDK, () => {}), {
        onSuccess: (newFaceTecSdkInstance) => {
          setIsInitializing(false);
          setStatusMessage('Iniciando Liveness Check 3D...');

          // Iniciar el procesador de Liveness de FaceTec
          newFaceTecSdkInstance.start3DLiveness(new LivenessCheckProcessor(mockSessionToken, newFaceTecSdkInstance, (success) => {
            if (success) {
              setStatusMessage('¡Verificación exitosa con FaceTec!');
              setTimeout(() => onVerify(), 1000);
            } else {
              setStatusMessage('Verificación cancelada o fallida.');
            }
          }));
        },
        onError: (error) => {
          console.error("FaceTec Initialization Error:", error);
          setStatusMessage('Error inicializando FaceTec SDK. (Mira la consola).');
          setIsInitializing(false);
        }
      });
    };

    if (!script) {
      script = document.createElement('script');
      script.id = 'facetec-sdk-script';
      script.src = '/facetec/core-sdk/FaceTecSDK.js/FaceTecSDK.js';
      script.async = true;
      script.onload = initializeFaceTec;
      script.onerror = () => setStatusMessage('Error al cargar el archivo FaceTecSDK.js');
      document.body.appendChild(script);
    } else {
      initializeFaceTec();
    }

    return () => {
      // Limpieza si es necesaria (FaceTec limpia su UI solo usualmente al terminar)
    };
  }, [onVerify]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '500px',
      backgroundColor: '#f5f5f5',
      borderRadius: '12px',
      padding: '20px',
      textAlign: 'center',
      border: '2px dashed #ccc',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <h2 style={{ color: '#333', marginBottom: '10px', zIndex: 2 }}>Verificación FaceTec</h2>

      {isInitializing ? (
        <div style={{ color: '#0066cc', fontWeight: 'bold', zIndex: 2 }}>{statusMessage}</div>
      ) : (
        <div style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '18px', zIndex: 2 }}>
          {statusMessage}
        </div>
      )}
      
      <p style={{ marginTop: '20px', fontSize: '14px', color: '#666', zIndex: 2 }}>
        Si ves un error, asegurate de haber puesto la PublicFaceScanEncryptionKey correcta en FaceTecConfig.js
      </p>
    </div>
  );
}
