import { NativeModule, requireNativeModule } from 'expo';

declare class BleAnuncioModule extends NativeModule<{}> {
  iniciar(servicioUuid: string): boolean;
  detener(): boolean;
}

export default requireNativeModule<BleAnuncioModule>('BleAnuncio');
