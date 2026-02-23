#import "SimpleScannerView.h"

#import <react/renderer/components/SimpleScannerViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/SimpleScannerViewSpec/EventEmitters.h>
#import <react/renderer/components/SimpleScannerViewSpec/Props.h>
#import <react/renderer/components/SimpleScannerViewSpec/RCTComponentViewHelpers.h>

#import "RCTFabricComponentsPlugins.h"
#import <AVFoundation/AVFoundation.h>
#if __has_include(<SimpleScanner/SimpleScanner-Swift.h>)
#import <SimpleScanner/SimpleScanner-Swift.h>
#else
#import "SimpleScanner-Swift.h"
#endif

using namespace facebook::react;

@interface SimpleScannerView () <RCTSimpleScannerViewViewProtocol>

@end

@implementation SimpleScannerView {
    SimpleScannerViewSwift * _swiftView;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
    return concreteComponentDescriptorProvider<SimpleScannerViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const SimpleScannerViewProps>();
    _props = defaultProps;

    _swiftView = [[SimpleScannerViewSwift alloc] initWithFrame:frame];
    _swiftView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;

    self.contentView = _swiftView;

    __weak SimpleScannerView *weakSelf = self;
    _swiftView.onBarcodeScanned = ^(NSDictionary *event) {
        SimpleScannerView *strongSelf = weakSelf;
        if (!strongSelf) return;

        if (strongSelf->_eventEmitter) {
            std::string type = [[event objectForKey:@"type"] UTF8String];
            std::string data = [[event objectForKey:@"data"] UTF8String];

            facebook::react::SimpleScannerViewEventEmitter::OnBarcodeScanned payload{
                .type = type,
                .data = data
            };

            // Extract flattened bounds if available
            NSNumber *boundsX = [event objectForKey:@"boundsX"];
            if (boundsX) {
                payload.boundsX = [boundsX doubleValue];
                payload.boundsY = [[event objectForKey:@"boundsY"] doubleValue];
                payload.boundsWidth = [[event objectForKey:@"boundsWidth"] doubleValue];
                payload.boundsHeight = [[event objectForKey:@"boundsHeight"] doubleValue];
            }

            auto emitter = std::static_pointer_cast<SimpleScannerViewEventEmitter const>(strongSelf->_eventEmitter);
            emitter->onBarcodeScanned(payload);
        }
    };

    _swiftView.onScannerError = ^(NSDictionary *event) {
        SimpleScannerView *strongSelf = weakSelf;
        if (!strongSelf) return;

        if (strongSelf->_eventEmitter) {
            std::string message = [[event objectForKey:@"message"] UTF8String];
            auto emitter = std::static_pointer_cast<SimpleScannerViewEventEmitter const>(strongSelf->_eventEmitter);
            emitter->onScannerError(SimpleScannerViewEventEmitter::OnScannerError{
                .message = message
            });
        }
    };

    _swiftView.onCameraStatusChange = ^(NSDictionary *event) {
        SimpleScannerView *strongSelf = weakSelf;
        if (!strongSelf) return;

        if (strongSelf->_eventEmitter) {
            std::string status = [[event objectForKey:@"status"] UTF8String];
            auto emitter = std::static_pointer_cast<SimpleScannerViewEventEmitter const>(strongSelf->_eventEmitter);
            emitter->onCameraStatusChange(SimpleScannerViewEventEmitter::OnCameraStatusChange{
                .status = status
            });
        }
    };
  }

  return self;
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
    const auto &oldViewProps = *std::static_pointer_cast<SimpleScannerViewProps const>(_props);
    const auto &newViewProps = *std::static_pointer_cast<SimpleScannerViewProps const>(props);

    // Update barcodeTypes
    if (oldViewProps.barcodeTypes != newViewProps.barcodeTypes) {
        NSMutableArray<NSString *> *barcodeTypes = [NSMutableArray array];
        for (const auto &type : newViewProps.barcodeTypes) {
            [barcodeTypes addObject:[NSString stringWithUTF8String:type.c_str()]];
        }
        _swiftView.barcodeTypes = barcodeTypes;
    }

    // Update flashEnabled
    if (oldViewProps.flashEnabled != newViewProps.flashEnabled) {
        _swiftView.flashEnabled = newViewProps.flashEnabled;
    }

    // Update isScanning
    if (oldViewProps.isScanning != newViewProps.isScanning) {
        _swiftView.isScanning = newViewProps.isScanning;
    }

    [super updateProps:props oldProps:oldProps];
}

Class<RCTComponentViewProtocol> SimpleScannerViewCls(void)
{
    return SimpleScannerView.class;
}

@end
