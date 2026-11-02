package com.simplescanner

import java.util.concurrent.atomic.AtomicBoolean

/** Owns decoder leases independently of CameraX/ML Kit callback threads. */
internal class ScannerState<D : AutoCloseable>(decoder: D) : AutoCloseable {
  private class Decoder<D : AutoCloseable>(val value: D) {
    var users = 0
    var retired = false
  }

  internal class Lease<D : AutoCloseable>(
    val decoder: D,
    internal val cameraGeneration: Long,
    internal val resultGeneration: Long,
    private val release: () -> Unit
  ) : AutoCloseable {
    internal val released = AtomicBoolean(false)
    override fun close() {
      if (released.compareAndSet(false, true)) release()
    }
  }

  private var current: Decoder<D>? = Decoder(decoder)
  private var cameraGeneration = 0L
  private var resultGeneration = 0L
  private var running = false
  private var scanning = true
  private var closed = false

  @Synchronized fun start(): Long? {
    if (closed || running) return null
    running = true
    resultGeneration++
    return ++cameraGeneration
  }

  @Synchronized fun isCameraCurrent(generation: Long): Boolean =
    !closed && running && generation == cameraGeneration

  @Synchronized fun stop() {
    running = false
    cameraGeneration++
    resultGeneration++
  }

  @Synchronized fun setScanning(enabled: Boolean) {
    if (scanning != enabled) {
      scanning = enabled
      resultGeneration++
    }
  }

  @Synchronized fun replaceDecoder(decoder: D?) {
    if (closed) {
      decoder?.close()
      return
    }
    resultGeneration++
    retire(current)
    current = decoder?.let { Decoder(it) }
  }

  @Synchronized fun acquire(generation: Long): Lease<D>? {
    if (!isCameraCurrent(generation) || !scanning) return null
    val entry = current ?: return null
    entry.users++
    return Lease(entry.value, cameraGeneration, resultGeneration) { release(entry) }
  }

  @Synchronized fun canDeliver(lease: Lease<D>): Boolean =
    !lease.released.get() && scanning && isCameraCurrent(lease.cameraGeneration) &&
      lease.resultGeneration == resultGeneration

  @Synchronized private fun release(entry: Decoder<D>) {
    entry.users--
    if (entry.retired && entry.users == 0) entry.value.close()
  }

  private fun retire(entry: Decoder<D>?) {
    if (entry == null) return
    entry.retired = true
    if (entry.users == 0) entry.value.close()
  }

  @Synchronized override fun close() {
    if (closed) return
    stop()
    closed = true
    retire(current)
    current = null
  }
}
