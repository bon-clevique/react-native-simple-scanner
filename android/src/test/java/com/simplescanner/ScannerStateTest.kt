package com.simplescanner

import org.junit.Assert.*
import org.junit.Test

class ScannerStateTest {
  private class Decoder : AutoCloseable {
    var closeCount = 0
    override fun close() { closeCount++ }
  }

  @Test fun stoppingInvalidatesPendingCameraInitializationAndOldAnalyzers() {
    val state = ScannerState(Decoder())
    val first = state.start()!!
    assertNull(state.start())
    state.stop()
    assertFalse(state.isCameraCurrent(first))
    val second = state.start()!!
    assertTrue(state.isCameraCurrent(second))
    assertNull(state.acquire(first))
    state.acquire(second)!!.close()
    state.close()
  }

  @Test fun pausingDetectionKeepsPreviewButSuppressesPendingResults() {
    val state = ScannerState(Decoder())
    val camera = state.start()!!
    val pending = state.acquire(camera)!!
    state.setScanning(false)
    assertTrue(state.isCameraCurrent(camera))
    assertNull(state.acquire(camera))
    assertFalse(state.canDeliver(pending))
    state.setScanning(true)
    assertFalse(state.canDeliver(pending))
    state.acquire(camera)!!.use { assertTrue(state.canDeliver(it)) }
    pending.close()
    state.close()
  }

  @Test fun formatChangesWaitForInFlightDecoderAndDiscardOldResults() {
    val old = Decoder()
    val replacement = Decoder()
    val state = ScannerState(old)
    val camera = state.start()!!
    val first = state.acquire(camera)!!
    val second = state.acquire(camera)!!
    state.replaceDecoder(replacement)
    assertEquals(0, old.closeCount)
    assertFalse(state.canDeliver(first))
    first.close()
    first.close()
    assertEquals(0, old.closeCount)
    second.close()
    assertEquals(1, old.closeCount)
    state.acquire(camera)!!.use { assertSame(replacement, it.decoder) }
    state.close()
    assertEquals(1, replacement.closeCount)
  }

  @Test fun emptyFormatsDisableDetectionAndCanBeReenabled() {
    val original = Decoder()
    val state = ScannerState(original)
    val camera = state.start()!!
    state.replaceDecoder(null)
    assertEquals(1, original.closeCount)
    assertNull(state.acquire(camera))
    val replacement = Decoder()
    state.replaceDecoder(replacement)
    state.acquire(camera)!!.use { assertTrue(state.canDeliver(it)) }
    state.close()
  }

  @Test fun cleanupIsIdempotentAndDefersCloseUntilProcessingCompletes() {
    val decoder = Decoder()
    val state = ScannerState(decoder)
    val camera = state.start()!!
    val pending = state.acquire(camera)!!
    state.close()
    state.close()
    assertEquals(0, decoder.closeCount)
    assertFalse(state.canDeliver(pending))
    assertNull(state.start())
    assertNull(state.acquire(camera))
    pending.close()
    pending.close()
    assertEquals(1, decoder.closeCount)
    val replacement = Decoder()
    state.replaceDecoder(replacement)
    assertEquals(1, replacement.closeCount)
  }

  @Test fun stoppingAndRestartingDoesNotDeliverResultsFromPreviousSession() {
    val state = ScannerState(Decoder())
    val pending = state.acquire(state.start()!!)!!
    state.stop()
    val next = state.start()!!
    assertFalse(state.canDeliver(pending))
    state.acquire(next)!!.use { assertTrue(state.canDeliver(it)) }
    pending.close()
    state.close()
  }
}
