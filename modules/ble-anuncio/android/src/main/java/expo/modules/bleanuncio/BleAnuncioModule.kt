package expo.modules.bleanuncio

import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothGattCharacteristic
import android.bluetooth.BluetoothGattServer
import android.bluetooth.BluetoothGattServerCallback
import android.bluetooth.BluetoothGattService
import android.bluetooth.BluetoothManager
import android.bluetooth.le.AdvertiseCallback
import android.bluetooth.le.AdvertiseData
import android.bluetooth.le.AdvertiseSettings
import android.bluetooth.le.BluetoothLeAdvertiser
import android.content.Context
import android.os.ParcelUuid
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.ByteArrayOutputStream
import java.util.UUID

class BleAnuncioModule : Module() {
  private var advertiser: BluetoothLeAdvertiser? = null
  private var callback: AdvertiseCallback? = null
  private var servidor: BluetoothGattServer? = null
  private val buffers = HashMap<String, ByteArrayOutputStream>()

  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("BleAnuncio")

    Events("onMensaje")

    Function("iniciar") { servicioUuid: String, caracteristicaUuid: String ->
      try {
        val manager = context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
        val adapter = manager.adapter ?: return@Function "sin-bluetooth"
        if (!adapter.isEnabled) return@Function "bt-apagado"

        abrirServidor(manager, servicioUuid, caracteristicaUuid)

        val adv = adapter.bluetoothLeAdvertiser ?: return@Function "sin-anunciante"
        advertiser = adv
        callback?.let { adv.stopAdvertising(it) }

        val settings = AdvertiseSettings.Builder()
          .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
          .setConnectable(true)
          .setTimeout(0)
          .build()

        val data = AdvertiseData.Builder()
          .setIncludeDeviceName(false)
          .addServiceUuid(ParcelUuid(UUID.fromString(servicioUuid)))
          .build()

        val cb = object : AdvertiseCallback() {}
        callback = cb
        adv.startAdvertising(settings, data, cb)
        "ok"
      } catch (e: Exception) {
        "error: " + (e.message ?: e.javaClass.simpleName)
      }
    }

    Function("detener") {
      try {
        callback?.let { advertiser?.stopAdvertising(it) }
      } catch (e: Exception) {
      }
      callback = null
      try {
        servidor?.close()
      } catch (e: Exception) {
      }
      servidor = null
      buffers.clear()
      true
    }
  }

  private fun abrirServidor(manager: BluetoothManager, servicioUuid: String, caracteristicaUuid: String) {
    servidor?.close()

    val cb = object : BluetoothGattServerCallback() {
      override fun onCharacteristicWriteRequest(
        device: BluetoothDevice,
        requestId: Int,
        characteristic: BluetoothGattCharacteristic,
        preparedWrite: Boolean,
        responseNeeded: Boolean,
        offset: Int,
        value: ByteArray
      ) {
        acumular(device.address, value)
        if (responseNeeded) {
          try {
            servidor?.sendResponse(device, requestId, android.bluetooth.BluetoothGatt.GATT_SUCCESS, offset, null)
          } catch (e: Exception) {
          }
        }
      }
    }

    val gatt = manager.openGattServer(context, cb)
    val servicio = BluetoothGattService(UUID.fromString(servicioUuid), BluetoothGattService.SERVICE_TYPE_PRIMARY)
    val caracteristica = BluetoothGattCharacteristic(
      UUID.fromString(caracteristicaUuid),
      BluetoothGattCharacteristic.PROPERTY_WRITE or BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE,
      BluetoothGattCharacteristic.PERMISSION_WRITE
    )
    servicio.addCharacteristic(caracteristica)
    gatt.addService(servicio)
    servidor = gatt
  }

  private fun acumular(direccion: String, trozo: ByteArray) {
    val buffer = buffers.getOrPut(direccion) { ByteArrayOutputStream() }
    for (b in trozo) {
      if (b.toInt() == 10) {
        val completo = buffer.toByteArray()
        buffer.reset()
        if (completo.isNotEmpty()) {
          sendEvent("onMensaje", mapOf("texto" to String(completo, Charsets.UTF_8)))
        }
      } else {
        buffer.write(b.toInt())
      }
    }
  }
}
