/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#if FB_SONARKIT_ENABLED

#import "NSNull+Foundation.h"

FB_LINKABLE(NSNull_Foundation)
@implementation NSNull (Foundation)

- (id)toFoundation {
  return self;
}

@end

#endif
