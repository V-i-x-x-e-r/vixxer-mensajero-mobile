import { NativeModule, requireOptionalNativeModule } from 'expo';

declare class BleAnuncioModule extends NativeModule<{}> {
  iniciar(servicioUuid: string): boolean;
  detener(): boolean;
}

export default requireOptionalNativeModule<BleAnuncioModule>('BleAnuncio');
