import { NativeModule, requireOptionalNativeModule } from 'expo';

type BleAnuncioEventos = {
  onMensaje: (evento: { texto: string }) => void;
};

declare class BleAnuncioModule extends NativeModule<BleAnuncioEventos> {
  iniciar(servicioUuid: string, caracteristicaUuid: string): boolean;
  detener(): boolean;
}

export default requireOptionalNativeModule<BleAnuncioModule>('BleAnuncio');
