#import <React/RCTViewComponentView.h>
#import <UIKit/UIKit.h>

#ifndef SimpleScannerViewNativeComponent_h
#define SimpleScannerViewNativeComponent_h

NS_ASSUME_NONNULL_BEGIN

@class SimpleScannerView;

typedef void (^RCTDirectEventBlock)(NSDictionary *event);

@interface SimpleScannerView : RCTViewComponentView

@property (nonatomic, copy) NSArray<NSString *> *barcodeTypes;
@property (nonatomic, assign) BOOL flashEnabled;
@property (nonatomic, copy) RCTDirectEventBlock onBarcodeScanned;
@property (nonatomic, copy) RCTDirectEventBlock onScannerError;

@end

NS_ASSUME_NONNULL_END

#endif /* SimpleScannerViewNativeComponent_h */
