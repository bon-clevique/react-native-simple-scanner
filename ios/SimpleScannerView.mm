#import "SimpleScannerView.h"

#import <react/renderer/components/SimpleScannerViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/SimpleScannerViewSpec/EventEmitters.h>
#import <react/renderer/components/SimpleScannerViewSpec/Props.h>
#import <react/renderer/components/SimpleScannerViewSpec/RCTComponentViewHelpers.h>

#import "RCTFabricComponentsPlugins.h"
#import "react-native-simple-scanner-Swift.h"

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

    // Store event handlers in Swift view
    __weak SimpleScannerView *weakSelf = self;
    _swiftView.onBarcodeScanned = ^(NSDictionary *event) {
        SimpleScannerView *strongSelf = weakSelf;
        if (!strongSelf) return;

        const auto &viewProps = *std::static_pointer_cast<SimpleScannerViewProps const>(strongSelf->_props);
        if (viewProps.onBarcodeScanned) {
            std::string type = [[event objectForKey:@"type"] UTF8String];
            std::string data = [[event objectForKey:@"data"] UTF8String];
            viewProps.onBarcodeScanned({type, data});
        }
    };

    _swiftView.onScannerError = ^(NSDictionary *event) {
        SimpleScannerView *strongSelf = weakSelf;
        if (!strongSelf) return;

        const auto &viewProps = *std::static_pointer_cast<SimpleScannerViewProps const>(strongSelf->_props);
        if (viewProps.onScannerError) {
            std::string message = [[event objectForKey:@"message"] UTF8String];
            viewProps.onScannerError({message});
        }
    };

    [super updateProps:props oldProps:oldProps];
}

Class<RCTComponentViewProtocol> SimpleScannerViewCls(void)
{
    return SimpleScannerView.class;
}

@end
