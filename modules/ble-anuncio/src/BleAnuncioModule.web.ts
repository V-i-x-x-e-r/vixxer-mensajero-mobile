import { registerWebModule, NativeModule } from 'expo';

class BleAnuncioModule extends NativeModule<{}> {
  iniciar(_servicioUuid: string, _caracteristicaUuid: string) { return false; }
  detener() { return false; }
}

export default registerWebModule(BleAnuncioModule, 'BleAnuncioModule');
