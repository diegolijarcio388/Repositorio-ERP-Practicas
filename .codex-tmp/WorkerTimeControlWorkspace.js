var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/react/cjs/react.development.js
var require_react_development = __commonJS({
  "node_modules/react/cjs/react.development.js"(exports, module) {
    "use strict";
    (function() {
      function defineDeprecationWarning(methodName, info) {
        Object.defineProperty(Component.prototype, methodName, {
          get: function() {
            console.warn(
              "%s(...) is deprecated in plain JavaScript React classes. %s",
              info[0],
              info[1]
            );
          }
        });
      }
      function getIteratorFn(maybeIterable) {
        if (null === maybeIterable || "object" !== typeof maybeIterable)
          return null;
        maybeIterable = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable["@@iterator"];
        return "function" === typeof maybeIterable ? maybeIterable : null;
      }
      function warnNoop(publicInstance, callerName) {
        publicInstance = (publicInstance = publicInstance.constructor) && (publicInstance.displayName || publicInstance.name) || "ReactClass";
        var warningKey = publicInstance + "." + callerName;
        didWarnStateUpdateForUnmountedComponent[warningKey] || (console.error(
          "Can't call %s on a component that is not yet mounted. This is a no-op, but it might indicate a bug in your application. Instead, assign to `this.state` directly or define a `state = {};` class property with the desired state in the %s component.",
          callerName,
          publicInstance
        ), didWarnStateUpdateForUnmountedComponent[warningKey] = true);
      }
      function Component(props, context, updater) {
        this.props = props;
        this.context = context;
        this.refs = emptyObject;
        this.updater = updater || ReactNoopUpdateQueue;
      }
      function ComponentDummy() {
      }
      function PureComponent(props, context, updater) {
        this.props = props;
        this.context = context;
        this.refs = emptyObject;
        this.updater = updater || ReactNoopUpdateQueue;
      }
      function noop() {
      }
      function testStringCoercion(value) {
        return "" + value;
      }
      function checkKeyStringCoercion(value) {
        try {
          testStringCoercion(value);
          var JSCompiler_inline_result = false;
        } catch (e) {
          JSCompiler_inline_result = true;
        }
        if (JSCompiler_inline_result) {
          JSCompiler_inline_result = console;
          var JSCompiler_temp_const = JSCompiler_inline_result.error;
          var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
          JSCompiler_temp_const.call(
            JSCompiler_inline_result,
            "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.",
            JSCompiler_inline_result$jscomp$0
          );
          return testStringCoercion(value);
        }
      }
      function getComponentNameFromType(type) {
        if (null == type) return null;
        if ("function" === typeof type)
          return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
        if ("string" === typeof type) return type;
        switch (type) {
          case REACT_FRAGMENT_TYPE:
            return "Fragment";
          case REACT_PROFILER_TYPE:
            return "Profiler";
          case REACT_STRICT_MODE_TYPE:
            return "StrictMode";
          case REACT_SUSPENSE_TYPE:
            return "Suspense";
          case REACT_SUSPENSE_LIST_TYPE:
            return "SuspenseList";
          case REACT_ACTIVITY_TYPE:
            return "Activity";
        }
        if ("object" === typeof type)
          switch ("number" === typeof type.tag && console.error(
            "Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."
          ), type.$$typeof) {
            case REACT_PORTAL_TYPE:
              return "Portal";
            case REACT_CONTEXT_TYPE:
              return type.displayName || "Context";
            case REACT_CONSUMER_TYPE:
              return (type._context.displayName || "Context") + ".Consumer";
            case REACT_FORWARD_REF_TYPE:
              var innerType = type.render;
              type = type.displayName;
              type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
              return type;
            case REACT_MEMO_TYPE:
              return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
            case REACT_LAZY_TYPE:
              innerType = type._payload;
              type = type._init;
              try {
                return getComponentNameFromType(type(innerType));
              } catch (x) {
              }
          }
        return null;
      }
      function getTaskName(type) {
        if (type === REACT_FRAGMENT_TYPE) return "<>";
        if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE)
          return "<...>";
        try {
          var name = getComponentNameFromType(type);
          return name ? "<" + name + ">" : "<...>";
        } catch (x) {
          return "<...>";
        }
      }
      function getOwner() {
        var dispatcher = ReactSharedInternals.A;
        return null === dispatcher ? null : dispatcher.getOwner();
      }
      function UnknownOwner() {
        return Error("react-stack-top-frame");
      }
      function hasValidKey(config) {
        if (hasOwnProperty.call(config, "key")) {
          var getter = Object.getOwnPropertyDescriptor(config, "key").get;
          if (getter && getter.isReactWarning) return false;
        }
        return void 0 !== config.key;
      }
      function defineKeyPropWarningGetter(props, displayName) {
        function warnAboutAccessingKey() {
          specialPropKeyWarningShown || (specialPropKeyWarningShown = true, console.error(
            "%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)",
            displayName
          ));
        }
        warnAboutAccessingKey.isReactWarning = true;
        Object.defineProperty(props, "key", {
          get: warnAboutAccessingKey,
          configurable: true
        });
      }
      function elementRefGetterWithDeprecationWarning() {
        var componentName = getComponentNameFromType(this.type);
        didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = true, console.error(
          "Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."
        ));
        componentName = this.props.ref;
        return void 0 !== componentName ? componentName : null;
      }
      function ReactElement(type, key, props, owner, debugStack, debugTask) {
        var refProp = props.ref;
        type = {
          $$typeof: REACT_ELEMENT_TYPE,
          type,
          key,
          props,
          _owner: owner
        };
        null !== (void 0 !== refProp ? refProp : null) ? Object.defineProperty(type, "ref", {
          enumerable: false,
          get: elementRefGetterWithDeprecationWarning
        }) : Object.defineProperty(type, "ref", { enumerable: false, value: null });
        type._store = {};
        Object.defineProperty(type._store, "validated", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: 0
        });
        Object.defineProperty(type, "_debugInfo", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: null
        });
        Object.defineProperty(type, "_debugStack", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: debugStack
        });
        Object.defineProperty(type, "_debugTask", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: debugTask
        });
        Object.freeze && (Object.freeze(type.props), Object.freeze(type));
        return type;
      }
      function cloneAndReplaceKey(oldElement, newKey) {
        newKey = ReactElement(
          oldElement.type,
          newKey,
          oldElement.props,
          oldElement._owner,
          oldElement._debugStack,
          oldElement._debugTask
        );
        oldElement._store && (newKey._store.validated = oldElement._store.validated);
        return newKey;
      }
      function validateChildKeys(node) {
        isValidElement(node) ? node._store && (node._store.validated = 1) : "object" === typeof node && null !== node && node.$$typeof === REACT_LAZY_TYPE && ("fulfilled" === node._payload.status ? isValidElement(node._payload.value) && node._payload.value._store && (node._payload.value._store.validated = 1) : node._store && (node._store.validated = 1));
      }
      function isValidElement(object) {
        return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
      }
      function escape(key) {
        var escaperLookup = { "=": "=0", ":": "=2" };
        return "$" + key.replace(/[=:]/g, function(match) {
          return escaperLookup[match];
        });
      }
      function getElementKey(element, index) {
        return "object" === typeof element && null !== element && null != element.key ? (checkKeyStringCoercion(element.key), escape("" + element.key)) : index.toString(36);
      }
      function resolveThenable(thenable) {
        switch (thenable.status) {
          case "fulfilled":
            return thenable.value;
          case "rejected":
            throw thenable.reason;
          default:
            switch ("string" === typeof thenable.status ? thenable.then(noop, noop) : (thenable.status = "pending", thenable.then(
              function(fulfilledValue) {
                "pending" === thenable.status && (thenable.status = "fulfilled", thenable.value = fulfilledValue);
              },
              function(error) {
                "pending" === thenable.status && (thenable.status = "rejected", thenable.reason = error);
              }
            )), thenable.status) {
              case "fulfilled":
                return thenable.value;
              case "rejected":
                throw thenable.reason;
            }
        }
        throw thenable;
      }
      function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
        var type = typeof children;
        if ("undefined" === type || "boolean" === type) children = null;
        var invokeCallback = false;
        if (null === children) invokeCallback = true;
        else
          switch (type) {
            case "bigint":
            case "string":
            case "number":
              invokeCallback = true;
              break;
            case "object":
              switch (children.$$typeof) {
                case REACT_ELEMENT_TYPE:
                case REACT_PORTAL_TYPE:
                  invokeCallback = true;
                  break;
                case REACT_LAZY_TYPE:
                  return invokeCallback = children._init, mapIntoArray(
                    invokeCallback(children._payload),
                    array,
                    escapedPrefix,
                    nameSoFar,
                    callback
                  );
              }
          }
        if (invokeCallback) {
          invokeCallback = children;
          callback = callback(invokeCallback);
          var childKey = "" === nameSoFar ? "." + getElementKey(invokeCallback, 0) : nameSoFar;
          isArrayImpl(callback) ? (escapedPrefix = "", null != childKey && (escapedPrefix = childKey.replace(userProvidedKeyEscapeRegex, "$&/") + "/"), mapIntoArray(callback, array, escapedPrefix, "", function(c) {
            return c;
          })) : null != callback && (isValidElement(callback) && (null != callback.key && (invokeCallback && invokeCallback.key === callback.key || checkKeyStringCoercion(callback.key)), escapedPrefix = cloneAndReplaceKey(
            callback,
            escapedPrefix + (null == callback.key || invokeCallback && invokeCallback.key === callback.key ? "" : ("" + callback.key).replace(
              userProvidedKeyEscapeRegex,
              "$&/"
            ) + "/") + childKey
          ), "" !== nameSoFar && null != invokeCallback && isValidElement(invokeCallback) && null == invokeCallback.key && invokeCallback._store && !invokeCallback._store.validated && (escapedPrefix._store.validated = 2), callback = escapedPrefix), array.push(callback));
          return 1;
        }
        invokeCallback = 0;
        childKey = "" === nameSoFar ? "." : nameSoFar + ":";
        if (isArrayImpl(children))
          for (var i = 0; i < children.length; i++)
            nameSoFar = children[i], type = childKey + getElementKey(nameSoFar, i), invokeCallback += mapIntoArray(
              nameSoFar,
              array,
              escapedPrefix,
              type,
              callback
            );
        else if (i = getIteratorFn(children), "function" === typeof i)
          for (i === children.entries && (didWarnAboutMaps || console.warn(
            "Using Maps as children is not supported. Use an array of keyed ReactElements instead."
          ), didWarnAboutMaps = true), children = i.call(children), i = 0; !(nameSoFar = children.next()).done; )
            nameSoFar = nameSoFar.value, type = childKey + getElementKey(nameSoFar, i++), invokeCallback += mapIntoArray(
              nameSoFar,
              array,
              escapedPrefix,
              type,
              callback
            );
        else if ("object" === type) {
          if ("function" === typeof children.then)
            return mapIntoArray(
              resolveThenable(children),
              array,
              escapedPrefix,
              nameSoFar,
              callback
            );
          array = String(children);
          throw Error(
            "Objects are not valid as a React child (found: " + ("[object Object]" === array ? "object with keys {" + Object.keys(children).join(", ") + "}" : array) + "). If you meant to render a collection of children, use an array instead."
          );
        }
        return invokeCallback;
      }
      function mapChildren(children, func, context) {
        if (null == children) return children;
        var result = [], count = 0;
        mapIntoArray(children, result, "", "", function(child) {
          return func.call(context, child, count++);
        });
        return result;
      }
      function lazyInitializer(payload) {
        if (-1 === payload._status) {
          var ioInfo = payload._ioInfo;
          null != ioInfo && (ioInfo.start = ioInfo.end = performance.now());
          ioInfo = payload._result;
          var thenable = ioInfo();
          thenable.then(
            function(moduleObject) {
              if (0 === payload._status || -1 === payload._status) {
                payload._status = 1;
                payload._result = moduleObject;
                var _ioInfo = payload._ioInfo;
                null != _ioInfo && (_ioInfo.end = performance.now());
                void 0 === thenable.status && (thenable.status = "fulfilled", thenable.value = moduleObject);
              }
            },
            function(error) {
              if (0 === payload._status || -1 === payload._status) {
                payload._status = 2;
                payload._result = error;
                var _ioInfo2 = payload._ioInfo;
                null != _ioInfo2 && (_ioInfo2.end = performance.now());
                void 0 === thenable.status && (thenable.status = "rejected", thenable.reason = error);
              }
            }
          );
          ioInfo = payload._ioInfo;
          if (null != ioInfo) {
            ioInfo.value = thenable;
            var displayName = thenable.displayName;
            "string" === typeof displayName && (ioInfo.name = displayName);
          }
          -1 === payload._status && (payload._status = 0, payload._result = thenable);
        }
        if (1 === payload._status)
          return ioInfo = payload._result, void 0 === ioInfo && console.error(
            "lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))\n\nDid you accidentally put curly braces around the import?",
            ioInfo
          ), "default" in ioInfo || console.error(
            "lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))",
            ioInfo
          ), ioInfo.default;
        throw payload._result;
      }
      function resolveDispatcher() {
        var dispatcher = ReactSharedInternals.H;
        null === dispatcher && console.error(
          "Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem."
        );
        return dispatcher;
      }
      function releaseAsyncTransition() {
        ReactSharedInternals.asyncTransitions--;
      }
      function enqueueTask(task) {
        if (null === enqueueTaskImpl)
          try {
            var requireString = ("require" + Math.random()).slice(0, 7);
            enqueueTaskImpl = (module && module[requireString]).call(
              module,
              "timers"
            ).setImmediate;
          } catch (_err) {
            enqueueTaskImpl = function(callback) {
              false === didWarnAboutMessageChannel && (didWarnAboutMessageChannel = true, "undefined" === typeof MessageChannel && console.error(
                "This browser does not have a MessageChannel implementation, so enqueuing tasks via await act(async () => ...) will fail. Please file an issue at https://github.com/facebook/react/issues if you encounter this warning."
              ));
              var channel = new MessageChannel();
              channel.port1.onmessage = callback;
              channel.port2.postMessage(void 0);
            };
          }
        return enqueueTaskImpl(task);
      }
      function aggregateErrors(errors) {
        return 1 < errors.length && "function" === typeof AggregateError ? new AggregateError(errors) : errors[0];
      }
      function popActScope(prevActQueue, prevActScopeDepth) {
        prevActScopeDepth !== actScopeDepth - 1 && console.error(
          "You seem to have overlapping act() calls, this is not supported. Be sure to await previous act() calls before making a new one. "
        );
        actScopeDepth = prevActScopeDepth;
      }
      function recursivelyFlushAsyncActWork(returnValue, resolve, reject) {
        var queue = ReactSharedInternals.actQueue;
        if (null !== queue)
          if (0 !== queue.length)
            try {
              flushActQueue(queue);
              enqueueTask(function() {
                return recursivelyFlushAsyncActWork(returnValue, resolve, reject);
              });
              return;
            } catch (error) {
              ReactSharedInternals.thrownErrors.push(error);
            }
          else ReactSharedInternals.actQueue = null;
        0 < ReactSharedInternals.thrownErrors.length ? (queue = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, reject(queue)) : resolve(returnValue);
      }
      function flushActQueue(queue) {
        if (!isFlushing) {
          isFlushing = true;
          var i = 0;
          try {
            for (; i < queue.length; i++) {
              var callback = queue[i];
              do {
                ReactSharedInternals.didUsePromise = false;
                var continuation = callback(false);
                if (null !== continuation) {
                  if (ReactSharedInternals.didUsePromise) {
                    queue[i] = callback;
                    queue.splice(0, i);
                    return;
                  }
                  callback = continuation;
                } else break;
              } while (1);
            }
            queue.length = 0;
          } catch (error) {
            queue.splice(0, i + 1), ReactSharedInternals.thrownErrors.push(error);
          } finally {
            isFlushing = false;
          }
        }
      }
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
      var REACT_ELEMENT_TYPE = /* @__PURE__ */ Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = /* @__PURE__ */ Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = /* @__PURE__ */ Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = /* @__PURE__ */ Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = /* @__PURE__ */ Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = /* @__PURE__ */ Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = /* @__PURE__ */ Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = /* @__PURE__ */ Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = /* @__PURE__ */ Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = /* @__PURE__ */ Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = /* @__PURE__ */ Symbol.for("react.memo"), REACT_LAZY_TYPE = /* @__PURE__ */ Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = /* @__PURE__ */ Symbol.for("react.activity"), MAYBE_ITERATOR_SYMBOL = Symbol.iterator, didWarnStateUpdateForUnmountedComponent = {}, ReactNoopUpdateQueue = {
        isMounted: function() {
          return false;
        },
        enqueueForceUpdate: function(publicInstance) {
          warnNoop(publicInstance, "forceUpdate");
        },
        enqueueReplaceState: function(publicInstance) {
          warnNoop(publicInstance, "replaceState");
        },
        enqueueSetState: function(publicInstance) {
          warnNoop(publicInstance, "setState");
        }
      }, assign = Object.assign, emptyObject = {};
      Object.freeze(emptyObject);
      Component.prototype.isReactComponent = {};
      Component.prototype.setState = function(partialState, callback) {
        if ("object" !== typeof partialState && "function" !== typeof partialState && null != partialState)
          throw Error(
            "takes an object of state variables to update or a function which returns an object of state variables."
          );
        this.updater.enqueueSetState(this, partialState, callback, "setState");
      };
      Component.prototype.forceUpdate = function(callback) {
        this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
      };
      var deprecatedAPIs = {
        isMounted: [
          "isMounted",
          "Instead, make sure to clean up subscriptions and pending requests in componentWillUnmount to prevent memory leaks."
        ],
        replaceState: [
          "replaceState",
          "Refactor your code to use setState instead (see https://github.com/facebook/react/issues/3236)."
        ]
      };
      for (fnName in deprecatedAPIs)
        deprecatedAPIs.hasOwnProperty(fnName) && defineDeprecationWarning(fnName, deprecatedAPIs[fnName]);
      ComponentDummy.prototype = Component.prototype;
      deprecatedAPIs = PureComponent.prototype = new ComponentDummy();
      deprecatedAPIs.constructor = PureComponent;
      assign(deprecatedAPIs, Component.prototype);
      deprecatedAPIs.isPureReactComponent = true;
      var isArrayImpl = Array.isArray, REACT_CLIENT_REFERENCE = /* @__PURE__ */ Symbol.for("react.client.reference"), ReactSharedInternals = {
        H: null,
        A: null,
        T: null,
        S: null,
        actQueue: null,
        asyncTransitions: 0,
        isBatchingLegacy: false,
        didScheduleLegacyUpdate: false,
        didUsePromise: false,
        thrownErrors: [],
        getCurrentStack: null,
        recentlyCreatedOwnerStacks: 0
      }, hasOwnProperty = Object.prototype.hasOwnProperty, createTask = console.createTask ? console.createTask : function() {
        return null;
      };
      deprecatedAPIs = {
        react_stack_bottom_frame: function(callStackForError) {
          return callStackForError();
        }
      };
      var specialPropKeyWarningShown, didWarnAboutOldJSXRuntime;
      var didWarnAboutElementRef = {};
      var unknownOwnerDebugStack = deprecatedAPIs.react_stack_bottom_frame.bind(
        deprecatedAPIs,
        UnknownOwner
      )();
      var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
      var didWarnAboutMaps = false, userProvidedKeyEscapeRegex = /\/+/g, reportGlobalError = "function" === typeof reportError ? reportError : function(error) {
        if ("object" === typeof window && "function" === typeof window.ErrorEvent) {
          var event = new window.ErrorEvent("error", {
            bubbles: true,
            cancelable: true,
            message: "object" === typeof error && null !== error && "string" === typeof error.message ? String(error.message) : String(error),
            error
          });
          if (!window.dispatchEvent(event)) return;
        } else if ("object" === typeof process && "function" === typeof process.emit) {
          process.emit("uncaughtException", error);
          return;
        }
        console.error(error);
      }, didWarnAboutMessageChannel = false, enqueueTaskImpl = null, actScopeDepth = 0, didWarnNoAwaitAct = false, isFlushing = false, queueSeveralMicrotasks = "function" === typeof queueMicrotask ? function(callback) {
        queueMicrotask(function() {
          return queueMicrotask(callback);
        });
      } : enqueueTask;
      deprecatedAPIs = Object.freeze({
        __proto__: null,
        c: function(size) {
          return resolveDispatcher().useMemoCache(size);
        }
      });
      var fnName = {
        map: mapChildren,
        forEach: function(children, forEachFunc, forEachContext) {
          mapChildren(
            children,
            function() {
              forEachFunc.apply(this, arguments);
            },
            forEachContext
          );
        },
        count: function(children) {
          var n = 0;
          mapChildren(children, function() {
            n++;
          });
          return n;
        },
        toArray: function(children) {
          return mapChildren(children, function(child) {
            return child;
          }) || [];
        },
        only: function(children) {
          if (!isValidElement(children))
            throw Error(
              "React.Children.only expected to receive a single React element child."
            );
          return children;
        }
      };
      exports.Activity = REACT_ACTIVITY_TYPE;
      exports.Children = fnName;
      exports.Component = Component;
      exports.Fragment = REACT_FRAGMENT_TYPE;
      exports.Profiler = REACT_PROFILER_TYPE;
      exports.PureComponent = PureComponent;
      exports.StrictMode = REACT_STRICT_MODE_TYPE;
      exports.Suspense = REACT_SUSPENSE_TYPE;
      exports.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = ReactSharedInternals;
      exports.__COMPILER_RUNTIME = deprecatedAPIs;
      exports.act = function(callback) {
        var prevActQueue = ReactSharedInternals.actQueue, prevActScopeDepth = actScopeDepth;
        actScopeDepth++;
        var queue = ReactSharedInternals.actQueue = null !== prevActQueue ? prevActQueue : [], didAwaitActCall = false;
        try {
          var result = callback();
        } catch (error) {
          ReactSharedInternals.thrownErrors.push(error);
        }
        if (0 < ReactSharedInternals.thrownErrors.length)
          throw popActScope(prevActQueue, prevActScopeDepth), callback = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, callback;
        if (null !== result && "object" === typeof result && "function" === typeof result.then) {
          var thenable = result;
          queueSeveralMicrotasks(function() {
            didAwaitActCall || didWarnNoAwaitAct || (didWarnNoAwaitAct = true, console.error(
              "You called act(async () => ...) without await. This could lead to unexpected testing behaviour, interleaving multiple act calls and mixing their scopes. You should - await act(async () => ...);"
            ));
          });
          return {
            then: function(resolve, reject) {
              didAwaitActCall = true;
              thenable.then(
                function(returnValue) {
                  popActScope(prevActQueue, prevActScopeDepth);
                  if (0 === prevActScopeDepth) {
                    try {
                      flushActQueue(queue), enqueueTask(function() {
                        return recursivelyFlushAsyncActWork(
                          returnValue,
                          resolve,
                          reject
                        );
                      });
                    } catch (error$0) {
                      ReactSharedInternals.thrownErrors.push(error$0);
                    }
                    if (0 < ReactSharedInternals.thrownErrors.length) {
                      var _thrownError = aggregateErrors(
                        ReactSharedInternals.thrownErrors
                      );
                      ReactSharedInternals.thrownErrors.length = 0;
                      reject(_thrownError);
                    }
                  } else resolve(returnValue);
                },
                function(error) {
                  popActScope(prevActQueue, prevActScopeDepth);
                  0 < ReactSharedInternals.thrownErrors.length ? (error = aggregateErrors(
                    ReactSharedInternals.thrownErrors
                  ), ReactSharedInternals.thrownErrors.length = 0, reject(error)) : reject(error);
                }
              );
            }
          };
        }
        var returnValue$jscomp$0 = result;
        popActScope(prevActQueue, prevActScopeDepth);
        0 === prevActScopeDepth && (flushActQueue(queue), 0 !== queue.length && queueSeveralMicrotasks(function() {
          didAwaitActCall || didWarnNoAwaitAct || (didWarnNoAwaitAct = true, console.error(
            "A component suspended inside an `act` scope, but the `act` call was not awaited. When testing React components that depend on asynchronous data, you must await the result:\n\nawait act(() => ...)"
          ));
        }), ReactSharedInternals.actQueue = null);
        if (0 < ReactSharedInternals.thrownErrors.length)
          throw callback = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, callback;
        return {
          then: function(resolve, reject) {
            didAwaitActCall = true;
            0 === prevActScopeDepth ? (ReactSharedInternals.actQueue = queue, enqueueTask(function() {
              return recursivelyFlushAsyncActWork(
                returnValue$jscomp$0,
                resolve,
                reject
              );
            })) : resolve(returnValue$jscomp$0);
          }
        };
      };
      exports.cache = function(fn) {
        return function() {
          return fn.apply(null, arguments);
        };
      };
      exports.cacheSignal = function() {
        return null;
      };
      exports.captureOwnerStack = function() {
        var getCurrentStack = ReactSharedInternals.getCurrentStack;
        return null === getCurrentStack ? null : getCurrentStack();
      };
      exports.cloneElement = function(element, config, children) {
        if (null === element || void 0 === element)
          throw Error(
            "The argument must be a React element, but you passed " + element + "."
          );
        var props = assign({}, element.props), key = element.key, owner = element._owner;
        if (null != config) {
          var JSCompiler_inline_result;
          a: {
            if (hasOwnProperty.call(config, "ref") && (JSCompiler_inline_result = Object.getOwnPropertyDescriptor(
              config,
              "ref"
            ).get) && JSCompiler_inline_result.isReactWarning) {
              JSCompiler_inline_result = false;
              break a;
            }
            JSCompiler_inline_result = void 0 !== config.ref;
          }
          JSCompiler_inline_result && (owner = getOwner());
          hasValidKey(config) && (checkKeyStringCoercion(config.key), key = "" + config.key);
          for (propName in config)
            !hasOwnProperty.call(config, propName) || "key" === propName || "__self" === propName || "__source" === propName || "ref" === propName && void 0 === config.ref || (props[propName] = config[propName]);
        }
        var propName = arguments.length - 2;
        if (1 === propName) props.children = children;
        else if (1 < propName) {
          JSCompiler_inline_result = Array(propName);
          for (var i = 0; i < propName; i++)
            JSCompiler_inline_result[i] = arguments[i + 2];
          props.children = JSCompiler_inline_result;
        }
        props = ReactElement(
          element.type,
          key,
          props,
          owner,
          element._debugStack,
          element._debugTask
        );
        for (key = 2; key < arguments.length; key++)
          validateChildKeys(arguments[key]);
        return props;
      };
      exports.createContext = function(defaultValue) {
        defaultValue = {
          $$typeof: REACT_CONTEXT_TYPE,
          _currentValue: defaultValue,
          _currentValue2: defaultValue,
          _threadCount: 0,
          Provider: null,
          Consumer: null
        };
        defaultValue.Provider = defaultValue;
        defaultValue.Consumer = {
          $$typeof: REACT_CONSUMER_TYPE,
          _context: defaultValue
        };
        defaultValue._currentRenderer = null;
        defaultValue._currentRenderer2 = null;
        return defaultValue;
      };
      exports.createElement = function(type, config, children) {
        for (var i = 2; i < arguments.length; i++)
          validateChildKeys(arguments[i]);
        i = {};
        var key = null;
        if (null != config)
          for (propName in didWarnAboutOldJSXRuntime || !("__self" in config) || "key" in config || (didWarnAboutOldJSXRuntime = true, console.warn(
            "Your app (or one of its dependencies) is using an outdated JSX transform. Update to the modern JSX transform for faster performance: https://react.dev/link/new-jsx-transform"
          )), hasValidKey(config) && (checkKeyStringCoercion(config.key), key = "" + config.key), config)
            hasOwnProperty.call(config, propName) && "key" !== propName && "__self" !== propName && "__source" !== propName && (i[propName] = config[propName]);
        var childrenLength = arguments.length - 2;
        if (1 === childrenLength) i.children = children;
        else if (1 < childrenLength) {
          for (var childArray = Array(childrenLength), _i = 0; _i < childrenLength; _i++)
            childArray[_i] = arguments[_i + 2];
          Object.freeze && Object.freeze(childArray);
          i.children = childArray;
        }
        if (type && type.defaultProps)
          for (propName in childrenLength = type.defaultProps, childrenLength)
            void 0 === i[propName] && (i[propName] = childrenLength[propName]);
        key && defineKeyPropWarningGetter(
          i,
          "function" === typeof type ? type.displayName || type.name || "Unknown" : type
        );
        var propName = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
        return ReactElement(
          type,
          key,
          i,
          getOwner(),
          propName ? Error("react-stack-top-frame") : unknownOwnerDebugStack,
          propName ? createTask(getTaskName(type)) : unknownOwnerDebugTask
        );
      };
      exports.createRef = function() {
        var refObject = { current: null };
        Object.seal(refObject);
        return refObject;
      };
      exports.forwardRef = function(render) {
        null != render && render.$$typeof === REACT_MEMO_TYPE ? console.error(
          "forwardRef requires a render function but received a `memo` component. Instead of forwardRef(memo(...)), use memo(forwardRef(...))."
        ) : "function" !== typeof render ? console.error(
          "forwardRef requires a render function but was given %s.",
          null === render ? "null" : typeof render
        ) : 0 !== render.length && 2 !== render.length && console.error(
          "forwardRef render functions accept exactly two parameters: props and ref. %s",
          1 === render.length ? "Did you forget to use the ref parameter?" : "Any additional parameter will be undefined."
        );
        null != render && null != render.defaultProps && console.error(
          "forwardRef render functions do not support defaultProps. Did you accidentally pass a React component?"
        );
        var elementType = { $$typeof: REACT_FORWARD_REF_TYPE, render }, ownName;
        Object.defineProperty(elementType, "displayName", {
          enumerable: false,
          configurable: true,
          get: function() {
            return ownName;
          },
          set: function(name) {
            ownName = name;
            render.name || render.displayName || (Object.defineProperty(render, "name", { value: name }), render.displayName = name);
          }
        });
        return elementType;
      };
      exports.isValidElement = isValidElement;
      exports.lazy = function(ctor) {
        ctor = { _status: -1, _result: ctor };
        var lazyType = {
          $$typeof: REACT_LAZY_TYPE,
          _payload: ctor,
          _init: lazyInitializer
        }, ioInfo = {
          name: "lazy",
          start: -1,
          end: -1,
          value: null,
          owner: null,
          debugStack: Error("react-stack-top-frame"),
          debugTask: console.createTask ? console.createTask("lazy()") : null
        };
        ctor._ioInfo = ioInfo;
        lazyType._debugInfo = [{ awaited: ioInfo }];
        return lazyType;
      };
      exports.memo = function(type, compare) {
        null == type && console.error(
          "memo: The first argument must be a component. Instead received: %s",
          null === type ? "null" : typeof type
        );
        compare = {
          $$typeof: REACT_MEMO_TYPE,
          type,
          compare: void 0 === compare ? null : compare
        };
        var ownName;
        Object.defineProperty(compare, "displayName", {
          enumerable: false,
          configurable: true,
          get: function() {
            return ownName;
          },
          set: function(name) {
            ownName = name;
            type.name || type.displayName || (Object.defineProperty(type, "name", { value: name }), type.displayName = name);
          }
        });
        return compare;
      };
      exports.startTransition = function(scope) {
        var prevTransition = ReactSharedInternals.T, currentTransition = {};
        currentTransition._updatedFibers = /* @__PURE__ */ new Set();
        ReactSharedInternals.T = currentTransition;
        try {
          var returnValue = scope(), onStartTransitionFinish = ReactSharedInternals.S;
          null !== onStartTransitionFinish && onStartTransitionFinish(currentTransition, returnValue);
          "object" === typeof returnValue && null !== returnValue && "function" === typeof returnValue.then && (ReactSharedInternals.asyncTransitions++, returnValue.then(releaseAsyncTransition, releaseAsyncTransition), returnValue.then(noop, reportGlobalError));
        } catch (error) {
          reportGlobalError(error);
        } finally {
          null === prevTransition && currentTransition._updatedFibers && (scope = currentTransition._updatedFibers.size, currentTransition._updatedFibers.clear(), 10 < scope && console.warn(
            "Detected a large number of updates inside startTransition. If this is due to a subscription please re-write it to use React provided hooks. Otherwise concurrent mode guarantees are off the table."
          )), null !== prevTransition && null !== currentTransition.types && (null !== prevTransition.types && prevTransition.types !== currentTransition.types && console.error(
            "We expected inner Transitions to have transferred the outer types set and that you cannot add to the outer Transition while inside the inner.This is a bug in React."
          ), prevTransition.types = currentTransition.types), ReactSharedInternals.T = prevTransition;
        }
      };
      exports.unstable_useCacheRefresh = function() {
        return resolveDispatcher().useCacheRefresh();
      };
      exports.use = function(usable) {
        return resolveDispatcher().use(usable);
      };
      exports.useActionState = function(action, initialState, permalink) {
        return resolveDispatcher().useActionState(
          action,
          initialState,
          permalink
        );
      };
      exports.useCallback = function(callback, deps) {
        return resolveDispatcher().useCallback(callback, deps);
      };
      exports.useContext = function(Context) {
        var dispatcher = resolveDispatcher();
        Context.$$typeof === REACT_CONSUMER_TYPE && console.error(
          "Calling useContext(Context.Consumer) is not supported and will cause bugs. Did you mean to call useContext(Context) instead?"
        );
        return dispatcher.useContext(Context);
      };
      exports.useDebugValue = function(value, formatterFn) {
        return resolveDispatcher().useDebugValue(value, formatterFn);
      };
      exports.useDeferredValue = function(value, initialValue) {
        return resolveDispatcher().useDeferredValue(value, initialValue);
      };
      exports.useEffect = function(create, deps) {
        null == create && console.warn(
          "React Hook useEffect requires an effect callback. Did you forget to pass a callback to the hook?"
        );
        return resolveDispatcher().useEffect(create, deps);
      };
      exports.useEffectEvent = function(callback) {
        return resolveDispatcher().useEffectEvent(callback);
      };
      exports.useId = function() {
        return resolveDispatcher().useId();
      };
      exports.useImperativeHandle = function(ref, create, deps) {
        return resolveDispatcher().useImperativeHandle(ref, create, deps);
      };
      exports.useInsertionEffect = function(create, deps) {
        null == create && console.warn(
          "React Hook useInsertionEffect requires an effect callback. Did you forget to pass a callback to the hook?"
        );
        return resolveDispatcher().useInsertionEffect(create, deps);
      };
      exports.useLayoutEffect = function(create, deps) {
        null == create && console.warn(
          "React Hook useLayoutEffect requires an effect callback. Did you forget to pass a callback to the hook?"
        );
        return resolveDispatcher().useLayoutEffect(create, deps);
      };
      exports.useMemo = function(create, deps) {
        return resolveDispatcher().useMemo(create, deps);
      };
      exports.useOptimistic = function(passthrough, reducer) {
        return resolveDispatcher().useOptimistic(passthrough, reducer);
      };
      exports.useReducer = function(reducer, initialArg, init) {
        return resolveDispatcher().useReducer(reducer, initialArg, init);
      };
      exports.useRef = function(initialValue) {
        return resolveDispatcher().useRef(initialValue);
      };
      exports.useState = function(initialState) {
        return resolveDispatcher().useState(initialState);
      };
      exports.useSyncExternalStore = function(subscribe, getSnapshot, getServerSnapshot) {
        return resolveDispatcher().useSyncExternalStore(
          subscribe,
          getSnapshot,
          getServerSnapshot
        );
      };
      exports.useTransition = function() {
        return resolveDispatcher().useTransition();
      };
      exports.version = "19.2.4";
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
    })();
  }
});

// node_modules/react/index.js
var require_react = __commonJS({
  "node_modules/react/index.js"(exports, module) {
    "use strict";
    if (false) {
      module.exports = null;
    } else {
      module.exports = require_react_development();
    }
  }
});

// node_modules/react/cjs/react-jsx-runtime.development.js
var require_react_jsx_runtime_development = __commonJS({
  "node_modules/react/cjs/react-jsx-runtime.development.js"(exports) {
    "use strict";
    (function() {
      function getComponentNameFromType(type) {
        if (null == type) return null;
        if ("function" === typeof type)
          return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
        if ("string" === typeof type) return type;
        switch (type) {
          case REACT_FRAGMENT_TYPE:
            return "Fragment";
          case REACT_PROFILER_TYPE:
            return "Profiler";
          case REACT_STRICT_MODE_TYPE:
            return "StrictMode";
          case REACT_SUSPENSE_TYPE:
            return "Suspense";
          case REACT_SUSPENSE_LIST_TYPE:
            return "SuspenseList";
          case REACT_ACTIVITY_TYPE:
            return "Activity";
        }
        if ("object" === typeof type)
          switch ("number" === typeof type.tag && console.error(
            "Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."
          ), type.$$typeof) {
            case REACT_PORTAL_TYPE:
              return "Portal";
            case REACT_CONTEXT_TYPE:
              return type.displayName || "Context";
            case REACT_CONSUMER_TYPE:
              return (type._context.displayName || "Context") + ".Consumer";
            case REACT_FORWARD_REF_TYPE:
              var innerType = type.render;
              type = type.displayName;
              type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
              return type;
            case REACT_MEMO_TYPE:
              return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
            case REACT_LAZY_TYPE:
              innerType = type._payload;
              type = type._init;
              try {
                return getComponentNameFromType(type(innerType));
              } catch (x) {
              }
          }
        return null;
      }
      function testStringCoercion(value) {
        return "" + value;
      }
      function checkKeyStringCoercion(value) {
        try {
          testStringCoercion(value);
          var JSCompiler_inline_result = false;
        } catch (e) {
          JSCompiler_inline_result = true;
        }
        if (JSCompiler_inline_result) {
          JSCompiler_inline_result = console;
          var JSCompiler_temp_const = JSCompiler_inline_result.error;
          var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
          JSCompiler_temp_const.call(
            JSCompiler_inline_result,
            "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.",
            JSCompiler_inline_result$jscomp$0
          );
          return testStringCoercion(value);
        }
      }
      function getTaskName(type) {
        if (type === REACT_FRAGMENT_TYPE) return "<>";
        if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE)
          return "<...>";
        try {
          var name = getComponentNameFromType(type);
          return name ? "<" + name + ">" : "<...>";
        } catch (x) {
          return "<...>";
        }
      }
      function getOwner() {
        var dispatcher = ReactSharedInternals.A;
        return null === dispatcher ? null : dispatcher.getOwner();
      }
      function UnknownOwner() {
        return Error("react-stack-top-frame");
      }
      function hasValidKey(config) {
        if (hasOwnProperty.call(config, "key")) {
          var getter = Object.getOwnPropertyDescriptor(config, "key").get;
          if (getter && getter.isReactWarning) return false;
        }
        return void 0 !== config.key;
      }
      function defineKeyPropWarningGetter(props, displayName) {
        function warnAboutAccessingKey() {
          specialPropKeyWarningShown || (specialPropKeyWarningShown = true, console.error(
            "%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)",
            displayName
          ));
        }
        warnAboutAccessingKey.isReactWarning = true;
        Object.defineProperty(props, "key", {
          get: warnAboutAccessingKey,
          configurable: true
        });
      }
      function elementRefGetterWithDeprecationWarning() {
        var componentName = getComponentNameFromType(this.type);
        didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = true, console.error(
          "Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."
        ));
        componentName = this.props.ref;
        return void 0 !== componentName ? componentName : null;
      }
      function ReactElement(type, key, props, owner, debugStack, debugTask) {
        var refProp = props.ref;
        type = {
          $$typeof: REACT_ELEMENT_TYPE,
          type,
          key,
          props,
          _owner: owner
        };
        null !== (void 0 !== refProp ? refProp : null) ? Object.defineProperty(type, "ref", {
          enumerable: false,
          get: elementRefGetterWithDeprecationWarning
        }) : Object.defineProperty(type, "ref", { enumerable: false, value: null });
        type._store = {};
        Object.defineProperty(type._store, "validated", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: 0
        });
        Object.defineProperty(type, "_debugInfo", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: null
        });
        Object.defineProperty(type, "_debugStack", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: debugStack
        });
        Object.defineProperty(type, "_debugTask", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: debugTask
        });
        Object.freeze && (Object.freeze(type.props), Object.freeze(type));
        return type;
      }
      function jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStack, debugTask) {
        var children = config.children;
        if (void 0 !== children)
          if (isStaticChildren)
            if (isArrayImpl(children)) {
              for (isStaticChildren = 0; isStaticChildren < children.length; isStaticChildren++)
                validateChildKeys(children[isStaticChildren]);
              Object.freeze && Object.freeze(children);
            } else
              console.error(
                "React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead."
              );
          else validateChildKeys(children);
        if (hasOwnProperty.call(config, "key")) {
          children = getComponentNameFromType(type);
          var keys = Object.keys(config).filter(function(k) {
            return "key" !== k;
          });
          isStaticChildren = 0 < keys.length ? "{key: someKey, " + keys.join(": ..., ") + ": ...}" : "{key: someKey}";
          didWarnAboutKeySpread[children + isStaticChildren] || (keys = 0 < keys.length ? "{" + keys.join(": ..., ") + ": ...}" : "{}", console.error(
            'A props object containing a "key" prop is being spread into JSX:\n  let props = %s;\n  <%s {...props} />\nReact keys must be passed directly to JSX without using spread:\n  let props = %s;\n  <%s key={someKey} {...props} />',
            isStaticChildren,
            children,
            keys,
            children
          ), didWarnAboutKeySpread[children + isStaticChildren] = true);
        }
        children = null;
        void 0 !== maybeKey && (checkKeyStringCoercion(maybeKey), children = "" + maybeKey);
        hasValidKey(config) && (checkKeyStringCoercion(config.key), children = "" + config.key);
        if ("key" in config) {
          maybeKey = {};
          for (var propName in config)
            "key" !== propName && (maybeKey[propName] = config[propName]);
        } else maybeKey = config;
        children && defineKeyPropWarningGetter(
          maybeKey,
          "function" === typeof type ? type.displayName || type.name || "Unknown" : type
        );
        return ReactElement(
          type,
          children,
          maybeKey,
          getOwner(),
          debugStack,
          debugTask
        );
      }
      function validateChildKeys(node) {
        isValidElement(node) ? node._store && (node._store.validated = 1) : "object" === typeof node && null !== node && node.$$typeof === REACT_LAZY_TYPE && ("fulfilled" === node._payload.status ? isValidElement(node._payload.value) && node._payload.value._store && (node._payload.value._store.validated = 1) : node._store && (node._store.validated = 1));
      }
      function isValidElement(object) {
        return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
      }
      var React = require_react(), REACT_ELEMENT_TYPE = /* @__PURE__ */ Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = /* @__PURE__ */ Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = /* @__PURE__ */ Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = /* @__PURE__ */ Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = /* @__PURE__ */ Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = /* @__PURE__ */ Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = /* @__PURE__ */ Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = /* @__PURE__ */ Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = /* @__PURE__ */ Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = /* @__PURE__ */ Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = /* @__PURE__ */ Symbol.for("react.memo"), REACT_LAZY_TYPE = /* @__PURE__ */ Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = /* @__PURE__ */ Symbol.for("react.activity"), REACT_CLIENT_REFERENCE = /* @__PURE__ */ Symbol.for("react.client.reference"), ReactSharedInternals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, hasOwnProperty = Object.prototype.hasOwnProperty, isArrayImpl = Array.isArray, createTask = console.createTask ? console.createTask : function() {
        return null;
      };
      React = {
        react_stack_bottom_frame: function(callStackForError) {
          return callStackForError();
        }
      };
      var specialPropKeyWarningShown;
      var didWarnAboutElementRef = {};
      var unknownOwnerDebugStack = React.react_stack_bottom_frame.bind(
        React,
        UnknownOwner
      )();
      var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
      var didWarnAboutKeySpread = {};
      exports.Fragment = REACT_FRAGMENT_TYPE;
      exports.jsx = function(type, config, maybeKey) {
        var trackActualOwner = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
        return jsxDEVImpl(
          type,
          config,
          maybeKey,
          false,
          trackActualOwner ? Error("react-stack-top-frame") : unknownOwnerDebugStack,
          trackActualOwner ? createTask(getTaskName(type)) : unknownOwnerDebugTask
        );
      };
      exports.jsxs = function(type, config, maybeKey) {
        var trackActualOwner = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
        return jsxDEVImpl(
          type,
          config,
          maybeKey,
          true,
          trackActualOwner ? Error("react-stack-top-frame") : unknownOwnerDebugStack,
          trackActualOwner ? createTask(getTaskName(type)) : unknownOwnerDebugTask
        );
      };
    })();
  }
});

// node_modules/react/jsx-runtime.js
var require_jsx_runtime = __commonJS({
  "node_modules/react/jsx-runtime.js"(exports, module) {
    "use strict";
    if (false) {
      module.exports = null;
    } else {
      module.exports = require_react_jsx_runtime_development();
    }
  }
});

// src/features/time-control/WorkerTimeControlWorkspace.tsx
var import_react6 = __toESM(require_react(), 1);

// src/modules/time-control/ui/TimeControlFeature.tsx
var import_react4 = __toESM(require_react(), 1);
var import_react5 = __toESM(require_react(), 1);

// src/shared/ui/Badge.tsx
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);

// src/shared/ui/Button.tsx
var import_jsx_runtime2 = __toESM(require_jsx_runtime(), 1);
var variantClasses = {
  primary: "bg-slate-900 text-white hover:bg-slate-700",
  secondary: "bg-slate-200 text-slate-900 hover:bg-slate-300",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100",
  danger: "bg-rose-600 text-white hover:bg-rose-500"
};
function Button({
  children,
  className = "",
  variant = "primary",
  ...props
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
    "button",
    {
      className: `rounded-md px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${className}`,
      ...props,
      children
    }
  );
}

// src/shared/ui/Input.tsx
var import_jsx_runtime3 = __toESM(require_jsx_runtime(), 1);
function Input({ label, className = "", id, ...props }) {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: "block", children: [
    label ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "mb-1 block text-sm text-slate-700", children: label }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      "input",
      {
        id,
        className: `w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-300 focus:ring ${className}`,
        ...props
      }
    )
  ] });
}

// src/shared/ui/Modal.tsx
var import_react = __toESM(require_react(), 1);
var import_jsx_runtime4 = __toESM(require_jsx_runtime(), 1);
function Modal({
  open,
  title,
  children,
  onClose,
  panelClassName,
  bodyClassName
}) {
  const [isRendered, setIsRendered] = (0, import_react.useState)(open);
  const [isVisible, setIsVisible] = (0, import_react.useState)(false);
  (0, import_react.useEffect)(() => {
    const animationMs = 180;
    if (open) {
      setIsRendered(true);
      const enterTimeout = window.setTimeout(() => setIsVisible(true), 10);
      return () => window.clearTimeout(enterTimeout);
    }
    setIsVisible(false);
    const exitTimeout = window.setTimeout(() => setIsRendered(false), animationMs);
    return () => window.clearTimeout(exitTimeout);
  }, [open]);
  if (!isRendered) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
    "div",
    {
      className: `fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 transition-opacity duration-200 ${isVisible ? "opacity-100" : "opacity-0"}`,
      children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
        "div",
        {
          className: `flex max-h-[90vh] w-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-lg transition-all duration-200 ease-out ${isVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-[0.98] opacity-0"} ${panelClassName ?? "max-w-lg"}`,
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "relative mb-4 pt-6", children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h3", { className: "px-10 text-center text-xl font-semibold", children: title }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                Button,
                {
                  variant: "ghost",
                  onClick: onClose,
                  "aria-label": "Cerrar modal",
                  className: "absolute right-0 top-0",
                  children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
                    "svg",
                    {
                      xmlns: "http://www.w3.org/2000/svg",
                      viewBox: "0 0 24 24",
                      fill: "none",
                      stroke: "currentColor",
                      strokeWidth: "2",
                      className: "h-6 w-6",
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("circle", { cx: "12", cy: "12", r: "9" }),
                        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9.5 9.5l5 5m0-5l-5 5" })
                      ]
                    }
                  )
                }
              )
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: `min-h-0 overflow-y-auto ${bodyClassName ?? ""}`, children })
          ]
        }
      )
    }
  );
}

// src/shared/ui/Select.tsx
var import_jsx_runtime5 = __toESM(require_jsx_runtime(), 1);
function Select({
  label,
  options,
  className = "",
  ...props
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "block", children: [
    label ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "mb-1 block text-sm text-slate-700", children: label }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
      "select",
      {
        className: `w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-300 focus:ring ${className}`,
        ...props,
        children: options.map((option) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("option", { value: option.value, children: option.label }, option.value))
      }
    )
  ] });
}

// src/shared/ui/Table.tsx
var import_jsx_runtime6 = __toESM(require_jsx_runtime(), 1);

// src/shared/ui/Toast.tsx
var import_react2 = __toESM(require_react(), 1);
var import_jsx_runtime7 = __toESM(require_jsx_runtime(), 1);

// src/shared/ui/TopbarControls.tsx
var import_react3 = __toESM(require_react(), 1);
var import_jsx_runtime8 = __toESM(require_jsx_runtime(), 1);

// src/modules/time-control/ui/TimeControlFeature.tsx
var import_jsx_runtime9 = __toESM(require_jsx_runtime(), 1);
var STATUS_LABELS = {
  OPEN: "Abierta",
  COMPLETED: "Completado",
  ABSENT: "Ausente",
  INCIDENT: "Incidencia"
};
var STATUS_CLASSES = {
  OPEN: "border border-amber-500 bg-transparent text-amber-700",
  COMPLETED: "border border-emerald-500 bg-transparent text-emerald-700",
  ABSENT: "border border-slate-400 bg-transparent text-slate-600",
  INCIDENT: "border border-rose-500 bg-transparent text-rose-700"
};
var CALENDAR_STATUS_BADGE_CLASSES = {
  OPEN: "border border-amber-500 bg-transparent text-amber-700",
  COMPLETED: "border border-emerald-500 bg-transparent text-emerald-700",
  ABSENT: "border border-slate-400 bg-transparent text-slate-600",
  INCIDENT: "border border-rose-500 bg-transparent text-rose-700"
};
var ADJUSTMENT_STATUS_LABELS = {
  PENDING_COORDINATOR: "Pendiente administraci\xF3n",
  PENDING_ADMIN: "Pendiente administraci\xF3n",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada"
};
var ADJUSTMENT_STATUS_CLASSES = {
  PENDING_COORDINATOR: "border border-amber-500 bg-transparent text-amber-700",
  PENDING_ADMIN: "border border-orange-500 bg-transparent text-orange-700",
  APPROVED: "border border-emerald-500 bg-transparent text-emerald-700",
  REJECTED: "border border-rose-500 bg-transparent text-rose-700"
};
var ADJUSTMENT_TYPE_LABELS = {
  CHECK_IN: "Entrada",
  CHECK_OUT: "Salida"
};
var ADJUSTMENT_TYPE_CLASSES = {
  CHECK_IN: "border border-sky-500 bg-transparent text-sky-700",
  CHECK_OUT: "border border-violet-500 bg-transparent text-violet-700"
};
var INCIDENT_JUSTIFICATION_STATUS_LABELS = {
  PENDING_COORDINATOR: "Pendiente administraci\xF3n",
  PENDING_ADMIN: "Pendiente administraci\xF3n",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada"
};
var INCIDENT_JUSTIFICATION_STATUS_CLASSES = {
  PENDING_COORDINATOR: "border border-amber-500 bg-transparent text-amber-700",
  PENDING_ADMIN: "border border-orange-500 bg-transparent text-orange-700",
  APPROVED: "border border-emerald-500 bg-transparent text-emerald-700",
  REJECTED: "border border-rose-500 bg-transparent text-rose-700"
};
var formatDateTime = (value) => {
  if (!value) return "-";
  const [datePart, timePart = ""] = value.split(" ");
  const [year, month, day] = datePart.split("-");
  if (!year || !month || !day) return value;
  const time = timePart.slice(0, 5);
  return time ? `${day}/${month}/${year} ${time}` : `${day}/${month}/${year}`;
};
var formatHoursFromMinutes = (value) => {
  const safeMinutes = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};
var getCurrentMonthValue = () => {
  const now = /* @__PURE__ */ new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};
var getTimeOnlyFromSqlDateTime = (value) => {
  if (!value) return null;
  const parts = value.split(" ");
  if (parts.length < 2) return null;
  return parts[1]?.slice(0, 5) ?? null;
};
var formatMonthLabel = (monthValue) => {
  const [year, month] = monthValue.split("-").map(Number);
  if (!year || !month) return monthValue;
  return new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric"
  }).format(new Date(Date.UTC(year, month - 1, 1)));
};
var shiftMonthValue = (monthValue, delta) => {
  const [year, month] = monthValue.split("-").map(Number);
  if (!year || !month) return getCurrentMonthValue();
  const shifted = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${shifted.getUTCFullYear()}-${String(
    shifted.getUTCMonth() + 1
  ).padStart(2, "0")}`;
};
var formatTimeOnly = (value) => {
  if (!value) return "-";
  const [, timePart = ""] = value.split(" ");
  return timePart.slice(0, 5) || "-";
};
var formatShortDate = (value) => {
  if (!value) return "-";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Madrid"
  }).format(new Date(Date.UTC(year, month - 1, day)));
};
var getMonthDays = (monthValue) => {
  const [year, month] = monthValue.split("-").map(Number);
  if (!year || !month) return [];
  const daysInMonth = new Date(year, month, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = String(index + 1).padStart(2, "0");
    return `${year}-${String(month).padStart(2, "0")}-${day}`;
  });
};
var WEEKDAY_SHORT_LABELS = ["dom", "lun", "mar", "mi\xE9", "jue", "vie", "s\xE1b"];
var getWeekdayShortLabel = (workDate) => {
  const [year, month, day] = workDate.split("-").map(Number);
  if (!year || !month || !day) return "";
  return WEEKDAY_SHORT_LABELS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
};
var isWeekend = (workDate) => {
  const weekday = getWeekdayShortLabel(workDate);
  return weekday === "s\xE1b" || weekday === "dom";
};
var CALENDAR_WEEKDAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];
var getTodaySqlDate = () => {
  const now = /* @__PURE__ */ new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;
};
var getRecordLine = (record) => {
  const checkIn = formatTimeOnly(record.checkInAt);
  const checkOut = formatTimeOnly(record.checkOutAt);
  return `${checkIn}-${checkOut === "-" ? "??" : checkOut}`;
};
var getAdminValidationReasonLabel = (record) => {
  switch (record.adminValidationReason) {
    case "OUTSIDE_ALLOWED_LOCATION":
      return "Fuera de sede";
    case "DEVICE_NOT_ALLOWED":
      return "Dispositivo no permitido";
    case "DESKTOP_DEVICE":
      return "Uso desde escritorio";
    case "UNKNOWN_DEVICE":
      return "Dispositivo no identificado";
    case "EXTERNAL_NETWORK":
      return "Red externa";
    default:
      return null;
  }
};
var isPendingAdminValidation = (record) => record.requiresAdminValidation && record.adminValidationStatus === "PENDING";
var getDisplayStatus = (status) => {
  if (status === "OPEN") return "OPEN";
  if (status === "COMPLETED") return "COMPLETED";
  if (status === "INCIDENT") return "INCIDENT";
  return "ABSENT";
};
var getDisplayRecordStatus = (record) => getDisplayStatus(record.status);
var getTrustTooltip = (record) => {
  if (getDisplayTrustLevel(record) === "REVIEW") {
    return "Requiere revisi\xF3n administrativa";
  }
  return void 0;
};
var getIncidentFlagMessage = (flag) => {
  switch (flag) {
    case "DURATION_TOO_SHORT":
      return "Duraci\xF3n demasiado corta";
    case "DURATION_TOO_LONG":
      return "Duraci\xF3n demasiado larga";
    case "NO_CHECKOUT":
      return "Falta fichaje de salida";
    case "OUT_OF_SCHEDULE":
      return "Fichaje fuera del rango horario permitido";
    case "OUT_OF_ALLOWED_LOCATION":
      return "Fichaje fuera del punto de fichaje permitido";
    case "DEVICE_NOT_ALLOWED":
      return "Fichaje desde dispositivo no permitido";
    default:
      return flag;
  }
};
var getRecordDotClass = (record) => {
  switch (getDisplayRecordStatus(record)) {
    case "COMPLETED":
      return "bg-emerald-500";
    case "INCIDENT":
      return "bg-rose-500";
    case "OPEN":
      return "bg-amber-500";
    case "ABSENT":
      return "bg-slate-400";
    default:
      return "bg-slate-300";
  }
};
var getCalendarRecordClasses = (record, isWeekendCell) => {
  if (isWeekendCell) {
    return "bg-slate-50 text-slate-500 ring-1 ring-inset ring-slate-200/50 shadow-sm";
  }
  switch (getDisplayRecordStatus(record)) {
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-900 ring-1 ring-inset ring-emerald-200/50 shadow-sm";
    case "INCIDENT":
      return "bg-rose-50 text-rose-900 ring-1 ring-inset ring-rose-200/50 shadow-sm";
    case "OPEN":
      return "bg-amber-50 text-amber-900 ring-1 ring-inset ring-amber-200/50 shadow-sm";
    case "ABSENT":
      return "bg-slate-50 text-slate-900 ring-1 ring-inset ring-slate-200/50 shadow-sm";
    default:
      return "bg-slate-50 text-slate-900 ring-1 ring-inset ring-slate-200/50 shadow-sm";
  }
};
var getCalendarCellClasses = (isWeekendCell, isTodayCell) => {
  if (isTodayCell) {
    return "border-violet-200 bg-violet-50/80 text-slate-900";
  }
  if (isWeekendCell) {
    return "border-slate-200 bg-slate-50 text-slate-500";
  }
  return "border-slate-200 bg-white text-slate-900";
};
var getPrimaryDayStatus = (records) => {
  if (records.some((record) => record.status === "INCIDENT")) return "INCIDENT";
  if (records.some((record) => record.status === "INCOMPLETE"))
    return "INCOMPLETE";
  if (records.some((record) => record.status === "OPEN")) return "OPEN";
  if (records.some((record) => record.status === "COMPLETED"))
    return "COMPLETED";
  return null;
};
var TRUST_LEVEL_CLASSES = {
  CORRECT: "border border-emerald-500 bg-transparent text-emerald-700",
  REVIEW: "border border-sky-500 bg-transparent text-sky-700"
};
var TRUST_LEVEL_LABELS = {
  CORRECT: "Correcta",
  REVIEW: "Revisar"
};
var RECORD_STATE_LEGEND_ITEMS = [
  {
    label: "Completado",
    borderClass: "border-emerald-500",
    dotClass: "bg-emerald-500",
    textClass: "text-emerald-700"
  },
  {
    label: "Abierta",
    borderClass: "border-amber-500",
    dotClass: "bg-amber-500",
    textClass: "text-amber-700"
  },
  {
    label: "Incidencia",
    borderClass: "border-rose-500",
    dotClass: "bg-rose-500",
    textClass: "text-rose-700"
  },
  {
    label: "Ausente",
    borderClass: "border-slate-400",
    dotClass: "bg-slate-400",
    textClass: "text-slate-600"
  }
];
var RECORD_VALIDATION_LEGEND_ITEMS = [
  {
    label: "Correcta",
    borderClass: "border-emerald-500",
    dotClass: "bg-emerald-500",
    textClass: "text-emerald-700"
  },
  {
    label: "Revisar",
    borderClass: "border-sky-500",
    dotClass: "bg-sky-500",
    textClass: "text-sky-700"
  }
];
var renderLegendChip = (item) => /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
  "span",
  {
    className: "inline-flex items-center gap-1.5",
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: `h-0.5 w-3 rounded-full ${item.dotClass}` }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: `text-[12px] font-medium ${item.textClass}`, children: item.label })
    ]
  },
  item.label
);
var POPUP_NEUTRAL_BUTTON_CLASS = "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900";
var POPUP_PRIMARY_BUTTON_CLASS = "rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-slate-800";
var POPUP_DANGER_BUTTON_CLASS = "rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-rose-700";
var getDisplayTrustLevel = (record) => (record.trustLevel ?? "MEDIA") === "ALTA" ? "CORRECT" : "REVIEW";
var hasAdminResponseForAdjustmentRequest = (request) => ["APPROVED", "REJECTED"].includes(request.status) && (Boolean(request.reviewedByAdminId) || Boolean(request.adminComment));
var hasAdminResponseForIncidentJustification = (justification) => ["APPROVED", "REJECTED"].includes(justification.status) && (Boolean(justification.reviewedByAdminId) || Boolean(justification.adminComment));
var getDisplayTrustLabel = (record) => TRUST_LEVEL_LABELS[getDisplayTrustLevel(record)];
var EXCLUSION_REQUEST_STATUS_LABELS = {
  PENDING_COORDINATOR: "Pendiente coordinador",
  PENDING_ADMIN: "Pendiente administraci\xF3n",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada"
};
var EXCLUSION_REQUEST_STATUS_CLASSES = {
  PENDING_COORDINATOR: "border border-amber-500 bg-transparent text-amber-700",
  PENDING_ADMIN: "border border-orange-500 bg-transparent text-orange-700",
  APPROVED: "border border-emerald-500 bg-transparent text-emerald-700",
  REJECTED: "border border-rose-500 bg-transparent text-rose-700"
};
var normalizeDateTimeLocalToSql = (value) => {
  if (!value) return "";
  const normalized = value.replace("T", " ");
  return normalized.length === 16 ? `${normalized}:00.000` : `${normalized}.000`;
};
var getMinutesFromTimeValue = (value) => {
  if (!value) return null;
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
};
var getMinutesFromSqlDateTime = (value) => getMinutesFromTimeValue(getTimeOnlyFromSqlDateTime(value));
var doesHourlySlotMatchRecord = (record, hour) => {
  const recordStartMinutes = getMinutesFromSqlDateTime(record.checkInAt);
  if (recordStartMinutes === null) {
    return false;
  }
  let recordEndMinutes = getMinutesFromSqlDateTime(record.checkOutAt);
  if (recordEndMinutes === null) {
    if (record.status === "OPEN" && record.workDate === getTodaySqlDate()) {
      const now = /* @__PURE__ */ new Date();
      recordEndMinutes = now.getHours() * 60 + now.getMinutes();
    } else {
      recordEndMinutes = recordStartMinutes + 1;
    }
  }
  const slotStartMinutes = hour * 60;
  const slotEndMinutes = slotStartMinutes + 60;
  return recordStartMinutes < slotEndMinutes && recordEndMinutes > slotStartMinutes;
};
var getHourlySlotRecordPriority = (record) => {
  if (record.status === "INCIDENT") return 500;
  if (record.status === "INCOMPLETE") return 400;
  if (record.status === "OPEN") return 300;
  if (record.requiresAdminValidation && record.adminValidationStatus === "PENDING") {
    return 200;
  }
  if (record.status === "COMPLETED") return 100;
  return 0;
};
var getHourlySlotRecord = (records, hour) => records.filter((record) => doesHourlySlotMatchRecord(record, hour)).sort(
  (left, right) => getHourlySlotRecordPriority(right) - getHourlySlotRecordPriority(left)
)[0];
var getQuadrantRecordColorClasses = (record) => {
  if (getDisplayRecordStatus(record) === "ABSENT") {
    return "bg-slate-400 shadow-slate-100";
  }
  if (getDisplayRecordStatus(record) === "INCIDENT") {
    return "bg-rose-500 shadow-rose-100";
  }
  if (getDisplayRecordStatus(record) === "OPEN") {
    return "bg-amber-500 shadow-amber-100";
  }
  switch (getDisplayTrustLevel(record)) {
    case "CORRECT":
      return "bg-emerald-500 shadow-emerald-100";
    case "REVIEW":
      return "bg-sky-500 shadow-sky-100";
    default:
      return "bg-slate-400 shadow-slate-100";
  }
};
var getStatusDetail = (record) => {
  if (record.requiresAdminValidation && record.adminValidationStatus === "PENDING") {
    const reasonLabel = getAdminValidationReasonLabel(record);
    const incidentDetails = record.incidentFlags?.length ? record.incidentFlags.map(getIncidentFlagMessage).join(", ") : null;
    if (reasonLabel && incidentDetails) {
      return `${reasonLabel}. Revisi\xF3n administrativa pendiente. ${incidentDetails}.`;
    }
    if (reasonLabel) {
      return `${reasonLabel}. Revisi\xF3n administrativa pendiente.`;
    }
    if (incidentDetails) {
      return `Fichaje pendiente de revisi\xF3n administrativa. ${incidentDetails}.`;
    }
    return "Fichaje pendiente de revisi\xF3n administrativa.";
  }
  if (record.status === "COMPLETED") {
    return "Fichaje completado sin problemas.";
  }
  if (record.status === "INCOMPLETE") {
    return "Falta fichaje de salida";
  }
  if (record.status !== "INCIDENT") {
    if (record.incidentFlags?.includes("OUT_OF_SCHEDULE")) {
      return "Fichaje fuera del rango horario permitido.";
    }
    if (record.incidentFlags?.includes("OUT_OF_ALLOWED_LOCATION")) {
      return "Fichaje fuera del punto de fichaje permitido.";
    }
    if (record.incidentFlags?.includes("DEVICE_NOT_ALLOWED")) {
      return "Fichaje realizado desde un dispositivo no permitido.";
    }
    return "-";
  }
  if (!record.incidentFlags?.length) {
    return "Incidencia detectada sin detalle adicional.";
  }
  const messages = record.incidentFlags.map(getIncidentFlagMessage);
  return messages.join(", ");
};
var JUSTIFIABLE_INCIDENT_FLAGS = [
  "DURATION_TOO_SHORT",
  "DURATION_TOO_LONG",
  "OUT_OF_SCHEDULE"
];
var COORDINATOR_REVIEWABLE_INCIDENT_FLAGS = [
  "DURATION_TOO_SHORT",
  "DURATION_TOO_LONG"
];
var hasJustifiableIncident = (flags) => Boolean(flags?.some((flag) => JUSTIFIABLE_INCIDENT_FLAGS.includes(flag)));
var hasCoordinatorReviewableIncident = (flags) => Boolean(
  flags?.some((flag) => COORDINATOR_REVIEWABLE_INCIDENT_FLAGS.includes(flag))
);
var getCurrentLocation = () => new Promise((resolve, reject) => {
  if (!("geolocation" in navigator)) {
    reject(
      new Error(
        "Este navegador no permite obtener la ubicaci\xF3n necesaria para fichar."
      )
    );
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (position) => {
      resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
    },
    () => {
      reject(
        new Error(
          "Debes habilitar los permisos de ubicaci\xF3n para poder fichar."
        )
      );
    },
    {
      enableHighAccuracy: true,
      timeout: 1e4,
      maximumAge: 0
    }
  );
});
function TimeControlFeature({
  session,
  mode,
  workerView = "overview",
  headerSlot
}) {
  const tabPanelAnimationStyle = {
    animation: "tcTabFadeSlide 220ms ease-out"
  };
  const isWorkerMode = mode === "worker";
  const isManagerMode = mode === "manager";
  const showWorkerOverview = isWorkerMode && workerView === "overview";
  const showWorkerRequests = isWorkerMode && workerView === "requests";
  const viewedTabsStorageKey = (0, import_react4.useMemo)(
    () => `time-control:viewed-tabs:${mode}:${session.email}`,
    [mode, session.email]
  );
  const selectedMonthStorageKey = (0, import_react4.useMemo)(
    () => `time-control:selected-month:${mode}:${session.email}`,
    [mode, session.email]
  );
  const [records, setRecords] = (0, import_react4.useState)([]);
  const [viewedTabs, setViewedTabs] = (0, import_react4.useState)([]);
  const [loading, setLoading] = (0, import_react4.useState)(true);
  const [submitting, setSubmitting] = (0, import_react4.useState)(false);
  const [requests, setRequests] = (0, import_react4.useState)([]);
  const [requestsLoading, setRequestsLoading] = (0, import_react4.useState)(true);
  const [requestSubmitting, setRequestSubmitting] = (0, import_react4.useState)(false);
  const [incidentJustifications, setIncidentJustifications] = (0, import_react4.useState)([]);
  const [
    dismissedApprovedIncidentRecordIds,
    setDismissedApprovedIncidentRecordIds
  ] = (0, import_react4.useState)([]);
  const [incidentJustificationsLoading, setIncidentJustificationsLoading] = (0, import_react4.useState)(true);
  const [incidentJustificationSubmitting, setIncidentJustificationSubmitting] = (0, import_react4.useState)(false);
  const [pendingRequests, setPendingRequests] = (0, import_react4.useState)([]);
  const [pendingRequestsLoading, setPendingRequestsLoading] = (0, import_react4.useState)(true);
  const [pendingIncidentJustifications, setPendingIncidentJustifications] = (0, import_react4.useState)([]);
  const [
    pendingIncidentJustificationsLoading,
    setPendingIncidentJustificationsLoading
  ] = (0, import_react4.useState)(true);
  const [myRemoteWorkRequests, setMyRemoteWorkRequests] = (0, import_react4.useState)([]);
  const [myPermissionRequests, setMyPermissionRequests] = (0, import_react4.useState)([]);
  const [myExclusionRequestsLoading, setMyExclusionRequestsLoading] = (0, import_react4.useState)(true);
  const [pendingRemoteWorkRequests, setPendingRemoteWorkRequests] = (0, import_react4.useState)([]);
  const [pendingPermissionRequests, setPendingPermissionRequests] = (0, import_react4.useState)([]);
  const [trackerDate, setTrackerDate] = (0, import_react4.useState)(getTodaySqlDate());
  const [pendingExclusionRequestsLoading, setPendingExclusionRequestsLoading] = (0, import_react4.useState)(true);
  const [reviewSubmittingId, setReviewSubmittingId] = (0, import_react4.useState)(
    null
  );
  const [reviewComments, setReviewComments] = (0, import_react4.useState)(
    {}
  );
  const [allWorkers, setAllWorkers] = (0, import_react4.useState)(
    []
  );
  const [selectedMonth, setSelectedMonth] = (0, import_react4.useState)(getCurrentMonthValue);
  const [managerUserFilter, setManagerUserFilter] = (0, import_react4.useState)("");
  const [managerUserSearch, setManagerUserSearch] = (0, import_react4.useState)("");
  const [managerDateFrom, setManagerDateFrom] = (0, import_react4.useState)("");
  const [managerDateTo, setManagerDateTo] = (0, import_react4.useState)("");
  const [managerHourFrom, setManagerHourFrom] = (0, import_react4.useState)("");
  const [managerHourTo, setManagerHourTo] = (0, import_react4.useState)("");
  const [managerTrustFilter, setManagerTrustFilter] = (0, import_react4.useState)("");
  const [trackerUserFilter, setTrackerUserFilter] = (0, import_react4.useState)("");
  const [trackerUserSearch, setTrackerUserSearch] = (0, import_react4.useState)("");
  const [trackerStatusFilter, setTrackerStatusFilter] = (0, import_react4.useState)("");
  const [trackerTrustFilter, setTrackerTrustFilter] = (0, import_react4.useState)("");
  const [requestsDateFrom, setRequestsDateFrom] = (0, import_react4.useState)("");
  const [requestsDateTo, setRequestsDateTo] = (0, import_react4.useState)("");
  const [requestsStatusFilter, setRequestsStatusFilter] = (0, import_react4.useState)("");
  const [requestsUserFilter, setRequestsUserFilter] = (0, import_react4.useState)("");
  const [requestsUserSearch, setRequestsUserSearch] = (0, import_react4.useState)("");
  const [incidentStatusFilter, setIncidentStatusFilter] = (0, import_react4.useState)("");
  const [incidentUserFilter, setIncidentUserFilter] = (0, import_react4.useState)("");
  const [incidentUserSearch, setIncidentUserSearch] = (0, import_react4.useState)("");
  const [incidentRecordStatusFilter, setIncidentRecordStatusFilter] = (0, import_react4.useState)("");
  const [incidentRecordUserFilter, setIncidentRecordUserFilter] = (0, import_react4.useState)("");
  const [incidentRecordUserSearch, setIncidentRecordUserSearch] = (0, import_react4.useState)("");
  const [incidentRecordDateFrom, setIncidentRecordDateFrom] = (0, import_react4.useState)("");
  const [incidentRecordDateTo, setIncidentRecordDateTo] = (0, import_react4.useState)("");
  const [incidentRecordTrustFilter, setIncidentRecordTrustFilter] = (0, import_react4.useState)("");
  const clearRequestFilters = () => {
    setRequestsDateFrom("");
    setRequestsDateTo("");
    setRequestsStatusFilter("");
    setRequestsUserFilter("");
    setRequestsUserSearch("");
  };
  const clearTrackerFilters = () => {
    setTrackerUserFilter("");
    setTrackerUserSearch("");
    setTrackerStatusFilter("");
    setTrackerTrustFilter("");
  };
  const clearIncidentFilters = () => {
    setIncidentStatusFilter("");
    setIncidentUserFilter("");
    setIncidentUserSearch("");
  };
  const clearIncidentRecordFilters = () => {
    setIncidentRecordStatusFilter("");
    setIncidentRecordUserFilter("");
    setIncidentRecordUserSearch("");
    setIncidentRecordDateFrom("");
    setIncidentRecordDateTo("");
    setIncidentRecordTrustFilter("");
  };
  const openManagerRecordDetail = (record) => {
    setSelectedDetailUserId(record.userId);
    setSelectedDetailDate(record.workDate);
  };
  const [requestType, setRequestType] = (0, import_react4.useState)("CHECK_IN");
  const [requestedTime, setRequestedTime] = (0, import_react4.useState)("");
  const [requestReason, setRequestReason] = (0, import_react4.useState)("");
  const [showLocationHelp, setShowLocationHelp] = (0, import_react4.useState)(false);
  const [showRequestModal, setShowRequestModal] = (0, import_react4.useState)(false);
  const [showExclusionRequestModal, setShowExclusionRequestModal] = (0, import_react4.useState)(false);
  const [exclusionRequestType, setExclusionRequestType] = (0, import_react4.useState)("REMOTE_WORK");
  const [exclusionRequestDate, setExclusionRequestDate] = (0, import_react4.useState)("");
  const [exclusionRequestReason, setExclusionRequestReason] = (0, import_react4.useState)("");
  const [exclusionRequestSubmitting, setExclusionRequestSubmitting] = (0, import_react4.useState)(false);
  const [workerRequestsTab, setWorkerRequestsTab] = (0, import_react4.useState)("requests");
  const [managerReviewTab, setManagerReviewTab] = (0, import_react4.useState)("records");
  const [selectedRecordForDetail, setSelectedRecordForDetail] = (0, import_react4.useState)(null);
  const [selectedIncidentRecordId, setSelectedIncidentRecordId] = (0, import_react4.useState)(null);
  const [incidentJustificationReason, setIncidentJustificationReason] = (0, import_react4.useState)("");
  const [adjustmentRequestToDelete, setAdjustmentRequestToDelete] = (0, import_react4.useState)(null);
  const [deletingAdjustmentRequestId, setDeletingAdjustmentRequestId] = (0, import_react4.useState)(null);
  const [incidentJustificationToDelete, setIncidentJustificationToDelete] = (0, import_react4.useState)(null);
  const [deletingIncidentJustificationId, setDeletingIncidentJustificationId] = (0, import_react4.useState)(null);
  const [selectedDetailDate, setSelectedDetailDate] = (0, import_react4.useState)(
    null
  );
  const [selectedDetailUserId, setSelectedDetailUserId] = (0, import_react4.useState)(null);
  const [selectedOverflowDate, setSelectedOverflowDate] = (0, import_react4.useState)(null);
  const [managerDailyListType, setManagerDailyListType] = (0, import_react4.useState)(null);
  const [showRemoteWorkModal, setShowRemoteWorkModal] = (0, import_react4.useState)(false);
  const [showManagerIncidentsModal, setShowManagerIncidentsModal] = (0, import_react4.useState)(false);
  const [managerTodayExclusions, setManagerTodayExclusions] = (0, import_react4.useState)({
    vacations: [],
    permissions: [],
    remoteWork: []
  });
  const exportToExcel = async () => {
    if (!managerUserFilter) {
      setToast({
        tone: "error",
        message: "Debes seleccionar un trabajador para exportar el Excel."
      });
      return;
    }
    const selectedWorkerRecords = records.filter((record) => record.userId === managerUserFilter).sort((left, right) => left.workDate.localeCompare(right.workDate));
    if (selectedWorkerRecords.length === 0) {
      setToast({
        tone: "error",
        message: "No hay registros del trabajador seleccionado para exportar."
      });
      return;
    }
    const dateFrom = managerDateFrom || selectedWorkerRecords[0]?.workDate;
    const dateTo = managerDateTo || selectedWorkerRecords[selectedWorkerRecords.length - 1]?.workDate;
    if (!dateFrom || !dateTo) {
      setToast({
        tone: "error",
        message: "No se pudo determinar el rango de fechas para exportar."
      });
      return;
    }
    showLoadingPopup("Generando Excel...");
    try {
      const params = new URLSearchParams({
        userId: managerUserFilter,
        dateFrom,
        dateTo
      });
      if (managerHourFrom) {
        params.set("hourFrom", managerHourFrom);
      }
      if (managerHourTo) {
        params.set("hourTo", managerHourTo);
      }
      const response = await fetch(
        `/api/time-control/admin/export.xlsx?${params.toString()}`
      );
      if (!response.ok) {
        const errorMessage = await readApiErrorMessage(
          response,
          "No se pudo generar el archivo Excel."
        );
        throw new Error(errorMessage);
      }
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const contentDisposition = response.headers.get("Content-Disposition") ?? "";
      const matchedFileName = contentDisposition.match(/filename="([^"]+)"/i);
      link.href = downloadUrl;
      link.download = matchedFileName?.[1] ?? "control-presencia.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      hideLoadingPopup();
      setToast({
        tone: "success",
        message: "Excel generado correctamente."
      });
    } catch (error) {
      hideLoadingPopup();
      setToast({
        tone: "error",
        message: error instanceof Error ? error.message : "No se pudo generar el archivo Excel."
      });
    }
  };
  const [toast, setToast] = (0, import_react4.useState)(null);
  const lastLoadRecordsErrorRef = (0, import_react5.useRef)(null);
  const loadRecordsPromiseRef = (0, import_react5.useRef)(null);
  const loadRecordsQueuedRef = (0, import_react5.useRef)(false);
  const [actionPopup, setActionPopup] = (0, import_react4.useState)(null);
  const pendingRequestsSectionRef = (0, import_react5.useRef)(null);
  const recordsSectionRef = (0, import_react5.useRef)(null);
  const openRecord = (0, import_react4.useMemo)(
    () => records.find((record) => record.status === "OPEN") ?? null,
    [records]
  );
  const filteredRecords = (0, import_react4.useMemo)(
    () => records.filter((record) => record.workDate.startsWith(selectedMonth)),
    [records, selectedMonth]
  );
  const totalWorkedMinutesInMonth = (0, import_react4.useMemo)(
    () => filteredRecords.reduce(
      (total, record) => total + record.workedMinutes,
      0
    ),
    [filteredRecords]
  );
  const monthlyStats = (0, import_react4.useMemo)(() => {
    const today = getTodaySqlDate();
    const monthDays = getMonthDays(selectedMonth);
    const workDaysSoFar = monthDays.filter(
      (day) => !isWeekend(day) && day <= today
    );
    const totalWorkDaysInMonth = monthDays.filter((day) => !isWeekend(day));
    const expectedSoFar = workDaysSoFar.length * 480;
    const totalExpected = totalWorkDaysInMonth.length * 480;
    return {
      expectedSoFar,
      totalExpected,
      balance: totalWorkedMinutesInMonth - expectedSoFar
    };
  }, [selectedMonth, totalWorkedMinutesInMonth]);
  const incidentCountInMonth = (0, import_react4.useMemo)(
    () => filteredRecords.filter((record) => record.status === "INCIDENT").length,
    [filteredRecords]
  );
  const recordsByDate = (0, import_react4.useMemo)(() => {
    const grouped = /* @__PURE__ */ new Map();
    for (const record of records) {
      const current = grouped.get(record.workDate) ?? [];
      current.push(record);
      grouped.set(record.workDate, current);
    }
    return grouped;
  }, [records]);
  const calendarWeeks = (0, import_react4.useMemo)(() => {
    const monthDays = getMonthDays(selectedMonth);
    if (monthDays.length === 0) {
      return [];
    }
    const firstDate = monthDays[0];
    const firstDay = new Date(
      Date.UTC(
        Number(firstDate.slice(0, 4)),
        Number(firstDate.slice(5, 7)) - 1,
        Number(firstDate.slice(8, 10))
      )
    );
    const firstDayOffset = (firstDay.getUTCDay() + 6) % 7;
    const today = getTodaySqlDate();
    const cells = [];
    for (let index = 0; index < firstDayOffset; index += 1) {
      cells.push({
        workDate: null,
        dayNumber: null,
        isWeekend: false,
        isToday: false,
        records: []
      });
    }
    for (const workDate of monthDays) {
      const dayRecords = [...recordsByDate.get(workDate) ?? []].sort(
        (a, b) => a.checkInAt.localeCompare(b.checkInAt)
      );
      const dayNumber = Number(workDate.slice(-2));
      cells.push({
        workDate,
        dayNumber,
        isWeekend: isWeekend(workDate),
        isToday: workDate === today,
        records: dayRecords
      });
    }
    while (cells.length % 7 !== 0) {
      cells.push({
        workDate: null,
        dayNumber: null,
        isWeekend: false,
        isToday: false,
        records: []
      });
    }
    const weeks = [];
    for (let index = 0; index < cells.length; index += 7) {
      weeks.push(cells.slice(index, index + 7));
    }
    return weeks;
  }, [recordsByDate, selectedMonth]);
  const monthRange = (0, import_react4.useMemo)(() => {
    const days = getMonthDays(selectedMonth);
    if (!days.length) return { from: "", to: "" };
    return { from: days[0], to: days[days.length - 1] };
  }, [selectedMonth]);
  const endpointBase = (0, import_react4.useMemo)(() => {
    const base = mode === "worker" ? "/api/time-control/me" : "/api/time-control/admin";
    const params = new URLSearchParams();
    if (mode === "worker") {
      if (monthRange.from) params.set("dateFrom", monthRange.from);
      if (monthRange.to) params.set("dateTo", monthRange.to);
    }
    return `${base}?${params.toString()}`;
  }, [mode, monthRange]);
  const canAccessManagementPanel = Boolean(
    session.role === "Admin" || session.role === "Responsable" || session.canManageTimeControlRequests
  );
  const isCoordinatorManagerView = Boolean(
    isManagerMode && session.role === "Responsable"
  );
  const isFunctionalAdmin = Boolean(
    session.role === "Admin" || session.canManageTimeControlRequests
  );
  const canReviewIncidentRequests = canAccessManagementPanel;
  const canReviewExclusionRequests = isFunctionalAdmin;
  const canViewTeamRecords = isFunctionalAdmin;
  const canReviewAdjustmentRequests = isFunctionalAdmin;
  const showCoordinatorModeBanner = isCoordinatorManagerView;
  const selectedDetailRecords = (0, import_react4.useMemo)(() => {
    if (!selectedDetailDate) return [];
    const dayItems = recordsByDate.get(selectedDetailDate) ?? [];
    if (selectedDetailUserId) {
      return dayItems.filter((r) => r.userId === selectedDetailUserId);
    }
    return dayItems;
  }, [selectedDetailDate, recordsByDate, selectedDetailUserId]);
  const selectedDetailWorkedMinutes = (0, import_react4.useMemo)(
    () => selectedDetailRecords.reduce(
      (total, record) => total + record.workedMinutes,
      0
    ),
    [selectedDetailRecords]
  );
  const selectedOverflowRecords = selectedOverflowDate ? recordsByDate.get(selectedOverflowDate) ?? [] : [];
  const workersFromRecords = (0, import_react4.useMemo)(
    () => Array.from(
      new Map(
        records.map((record) => [
          record.userId,
          {
            id: record.userId,
            name: record.userName ?? record.userId
          }
        ])
      ).values()
    ),
    [records]
  );
  const teamMembers = allWorkers.length > 0 ? allWorkers : workersFromRecords.sort(
    (left, right) => left.name.localeCompare(right.name)
  );
  const teamMemberNameById = (0, import_react4.useMemo)(
    () => new Map(teamMembers.map((member) => [member.id, member.name])),
    [teamMembers]
  );
  const normalizedManagerUserSearch = managerUserSearch.trim().toLocaleLowerCase("es-ES");
  const normalizedTrackerUserSearch = trackerUserSearch.trim().toLocaleLowerCase("es-ES");
  const normalizedRequestsUserSearch = requestsUserSearch.trim().toLocaleLowerCase("es-ES");
  const normalizedIncidentUserSearch = incidentUserSearch.trim().toLocaleLowerCase("es-ES");
  const normalizedIncidentRecordUserSearch = incidentRecordUserSearch.trim().toLocaleLowerCase("es-ES");
  const getDisplayUserName = (userId, userName) => {
    const safeUserName = userName?.trim();
    if (safeUserName) {
      return safeUserName;
    }
    return teamMemberNameById.get(userId) ?? userId;
  };
  const excludedFromTodayTrackingIds = (0, import_react4.useMemo)(
    () => /* @__PURE__ */ new Set([
      ...managerTodayExclusions.vacations.map((entry) => entry.id),
      ...managerTodayExclusions.permissions.map((entry) => entry.id)
    ]),
    [managerTodayExclusions.permissions, managerTodayExclusions.vacations]
  );
  const totalExpectedTodayUsers = (0, import_react4.useMemo)(
    () => teamMembers.filter(
      (member) => !excludedFromTodayTrackingIds.has(member.id)
    ),
    [excludedFromTodayTrackingIds, teamMembers]
  );
  const managerVisibleRecords = (0, import_react4.useMemo)(() => {
    return records.filter((record) => {
      if (managerUserFilter) {
        if (record.userId !== managerUserFilter) {
          return false;
        }
      } else if (normalizedManagerUserSearch) {
        const displayName = getDisplayUserName(
          record.userId,
          record.userName
        ).toLocaleLowerCase("es-ES");
        if (!displayName.includes(normalizedManagerUserSearch)) {
          return false;
        }
      }
      if (managerDateFrom && record.workDate < managerDateFrom) {
        return false;
      }
      if (managerDateTo && record.workDate > managerDateTo) {
        return false;
      }
      const checkInTime = getTimeOnlyFromSqlDateTime(record.checkInAt);
      const checkOutTime = getTimeOnlyFromSqlDateTime(record.checkOutAt);
      if (managerHourFrom || managerHourTo) {
        if (!checkInTime) {
          return false;
        }
        const recordStartTime = checkInTime;
        const recordEndTime = checkOutTime ?? checkInTime;
        if (managerHourFrom && recordEndTime < managerHourFrom) {
          return false;
        }
        if (managerHourTo && recordStartTime > managerHourTo) {
          return false;
        }
      }
      if (managerTrustFilter && getDisplayTrustLevel(record) !== managerTrustFilter) {
        return false;
      }
      return true;
    });
  }, [
    managerDateFrom,
    managerDateTo,
    managerHourFrom,
    managerHourTo,
    managerTrustFilter,
    managerUserFilter,
    normalizedManagerUserSearch,
    records
  ]);
  const managerIncidentRecords = (0, import_react4.useMemo)(
    () => records.filter((record) => {
      if (record.status !== "INCIDENT" && record.status !== "INCOMPLETE") {
        return false;
      }
      if (!isCoordinatorManagerView) {
        return true;
      }
      return hasCoordinatorReviewableIncident(record.incidentFlags);
    }),
    [isCoordinatorManagerView, records]
  );
  const filteredManagerIncidentRecords = (0, import_react4.useMemo)(
    () => managerIncidentRecords.filter((record) => {
      if (incidentRecordStatusFilter && record.status !== incidentRecordStatusFilter) {
        return false;
      }
      if (incidentRecordUserFilter && record.userId !== incidentRecordUserFilter) {
        return false;
      }
      if (!incidentRecordUserFilter && normalizedIncidentRecordUserSearch) {
        const displayName = getDisplayUserName(
          record.userId,
          record.userName
        ).toLocaleLowerCase("es-ES");
        if (!displayName.includes(normalizedIncidentRecordUserSearch)) {
          return false;
        }
      }
      if (incidentRecordDateFrom && record.workDate < incidentRecordDateFrom) {
        return false;
      }
      if (incidentRecordDateTo && record.workDate > incidentRecordDateTo) {
        return false;
      }
      if (incidentRecordTrustFilter && getDisplayTrustLevel(record) !== incidentRecordTrustFilter) {
        return false;
      }
      return true;
    }),
    [
      incidentRecordDateFrom,
      incidentRecordDateTo,
      incidentRecordStatusFilter,
      incidentRecordTrustFilter,
      incidentRecordUserFilter,
      normalizedIncidentRecordUserSearch,
      managerIncidentRecords
    ]
  );
  const managerIncidentUsersCount = (0, import_react4.useMemo)(
    () => new Set(managerIncidentRecords.map((record) => record.userId)).size,
    [managerIncidentRecords]
  );
  const todaySqlDate = getTodaySqlDate();
  const checkedInTrackerUserIds = (0, import_react4.useMemo)(
    () => new Set(
      records.filter((record) => record.workDate === trackerDate).map((record) => record.userId)
    ),
    [records, trackerDate]
  );
  const trackerDateRecordsMap = (0, import_react4.useMemo)(() => {
    const map = /* @__PURE__ */ new Map();
    records.filter((r) => r.workDate === trackerDate).forEach((r) => {
      const userRecords = map.get(r.userId) || [];
      userRecords.push(r);
      map.set(r.userId, userRecords);
    });
    return map;
  }, [records, trackerDate]);
  const checkedInTodayUsers = (0, import_react4.useMemo)(
    () => totalExpectedTodayUsers.filter(
      (member) => checkedInTrackerUserIds.has(member.id)
    ),
    [checkedInTrackerUserIds, totalExpectedTodayUsers]
  );
  const notCheckedInTodayUsers = (0, import_react4.useMemo)(
    () => totalExpectedTodayUsers.filter(
      (member) => !checkedInTrackerUserIds.has(member.id)
    ),
    [checkedInTrackerUserIds, totalExpectedTodayUsers]
  );
  const remoteWorkTodayUsers = (0, import_react4.useMemo)(() => {
    const remoteWorkIds = new Set(
      managerTodayExclusions.remoteWork.map((entry) => entry.id)
    );
    return teamMembers.filter((member) => remoteWorkIds.has(member.id));
  }, [managerTodayExclusions.remoteWork, teamMembers]);
  const remoteWorkCheckedInCount = (0, import_react4.useMemo)(
    () => remoteWorkTodayUsers.filter(
      (member) => checkedInTrackerUserIds.has(member.id)
      // <-- Aquí cambiamos el nombre
    ).length,
    [checkedInTrackerUserIds, remoteWorkTodayUsers]
    // <-- Y aquí también en las dependencias
  );
  const excludedTodayUsers = (0, import_react4.useMemo)(
    () => [
      ...managerTodayExclusions.vacations,
      ...managerTodayExclusions.permissions
    ],
    [managerTodayExclusions.permissions, managerTodayExclusions.vacations]
  );
  const managerDailyListUsers = managerDailyListType === "checked-in" ? checkedInTodayUsers : managerDailyListType === "missing" ? notCheckedInTodayUsers : managerDailyListType === "exclusions" ? excludedTodayUsers : [];
  const managerTrackerMembers = (0, import_react4.useMemo)(
    () => teamMembers.filter((member) => {
      if (trackerUserFilter && member.id !== trackerUserFilter) {
        return false;
      }
      if (!trackerUserFilter && normalizedTrackerUserSearch) {
        const displayName = member.name.toLocaleLowerCase("es-ES");
        if (!displayName.includes(normalizedTrackerUserSearch)) {
          return false;
        }
      }
      const userRecords = trackerDateRecordsMap.get(member.id) ?? [];
      if (trackerStatusFilter && !userRecords.some(
        (record) => getDisplayRecordStatus(record) === trackerStatusFilter
      )) {
        return false;
      }
      if (trackerTrustFilter && !userRecords.some(
        (record) => getDisplayTrustLevel(record) === trackerTrustFilter
      )) {
        return false;
      }
      return true;
    }),
    [
      teamMembers,
      trackerDateRecordsMap,
      trackerStatusFilter,
      trackerTrustFilter,
      trackerUserFilter,
      normalizedTrackerUserSearch
    ]
  );
  const incidentJustificationsByRecordId = (0, import_react4.useMemo)(
    () => new Map(
      incidentJustifications.filter((justification) => !justification.hiddenByWorkerAt).map((justification) => [justification.recordId, justification])
    ),
    [incidentJustifications]
  );
  const hiddenRespondedIncidentRecordIds = (0, import_react4.useMemo)(
    () => /* @__PURE__ */ new Set([
      ...dismissedApprovedIncidentRecordIds,
      ...incidentJustifications.filter(
        (justification) => hasAdminResponseForIncidentJustification(justification) && Boolean(justification.hiddenByWorkerAt)
      ).map((justification) => justification.recordId)
    ]),
    [dismissedApprovedIncidentRecordIds, incidentJustifications]
  );
  const justifiableIncidentRecords = (0, import_react4.useMemo)(
    () => records.filter(
      (record) => record.status === "INCIDENT" && hasJustifiableIncident(record.incidentFlags) && !hiddenRespondedIncidentRecordIds.has(record.id)
    ).sort((left, right) => {
      const byDate = right.workDate.localeCompare(left.workDate);
      if (byDate !== 0) return byDate;
      return right.checkInAt.localeCompare(left.checkInAt);
    }),
    [hiddenRespondedIncidentRecordIds, records]
  );
  const myUnifiedExclusionRequests = (0, import_react4.useMemo)(
    () => [
      ...myRemoteWorkRequests.map((entry) => ({
        id: entry.id,
        kind: "REMOTE_WORK",
        userId: entry.userId,
        userName: entry.userName,
        requestDate: entry.remoteWorkDate,
        reason: entry.reason,
        status: entry.status,
        approverComment: entry.approverComment
      })),
      ...myPermissionRequests.map((entry) => ({
        id: entry.id,
        kind: "PERMISSION",
        userId: entry.userId,
        userName: entry.userName,
        requestDate: entry.permissionDate,
        reason: entry.reason,
        status: entry.status,
        approverComment: entry.approverComment
      }))
    ].sort(
      (left, right) => right.requestDate.localeCompare(left.requestDate)
    ),
    [myPermissionRequests, myRemoteWorkRequests]
  );
  const pendingUnifiedExclusionRequests = (0, import_react4.useMemo)(
    () => [
      ...pendingRemoteWorkRequests.map((entry) => ({
        id: entry.id,
        kind: "REMOTE_WORK",
        userId: entry.userId,
        userName: entry.userName,
        requestDate: entry.remoteWorkDate,
        reason: entry.reason,
        status: entry.status,
        approverComment: entry.approverComment
      })),
      ...pendingPermissionRequests.map((entry) => ({
        id: entry.id,
        kind: "PERMISSION",
        userId: entry.userId,
        userName: entry.userName,
        requestDate: entry.permissionDate,
        reason: entry.reason,
        status: entry.status,
        approverComment: entry.approverComment
      }))
    ].sort(
      (left, right) => right.requestDate.localeCompare(left.requestDate)
    ),
    [pendingPermissionRequests, pendingRemoteWorkRequests]
  );
  const filteredWorkerRequests = (0, import_react4.useMemo)(() => {
    return requests.filter((req) => {
      if (requestsDateFrom && req.requestDate < requestsDateFrom) return false;
      if (requestsDateTo && req.requestDate > requestsDateTo) return false;
      if (requestsStatusFilter && req.status !== requestsStatusFilter)
        return false;
      return true;
    });
  }, [requests, requestsDateFrom, requestsDateTo, requestsStatusFilter]);
  const filteredWorkerExclusions = (0, import_react4.useMemo)(() => {
    return myUnifiedExclusionRequests.filter((req) => {
      if (requestsDateFrom && req.requestDate < requestsDateFrom) return false;
      if (requestsDateTo && req.requestDate > requestsDateTo) return false;
      if (requestsStatusFilter && req.status !== requestsStatusFilter)
        return false;
      return true;
    });
  }, [
    myUnifiedExclusionRequests,
    requestsDateFrom,
    requestsDateTo,
    requestsStatusFilter
  ]);
  const filteredWorkerIncidents = (0, import_react4.useMemo)(() => {
    return justifiableIncidentRecords.filter((record) => {
      if (requestsDateFrom && record.workDate < requestsDateFrom) return false;
      if (requestsDateTo && record.workDate > requestsDateTo) return false;
      return true;
    });
  }, [justifiableIncidentRecords, requestsDateFrom, requestsDateTo]);
  const filteredManagerRequests = (0, import_react4.useMemo)(() => {
    return pendingRequests.filter((req) => {
      if (requestsUserFilter && req.userId !== requestsUserFilter) return false;
      if (!requestsUserFilter && normalizedRequestsUserSearch) {
        const displayName = getDisplayUserName(
          req.userId,
          req.userName
        ).toLocaleLowerCase("es-ES");
        if (!displayName.includes(normalizedRequestsUserSearch)) return false;
      }
      if (requestsDateFrom && req.requestDate < requestsDateFrom) return false;
      if (requestsDateTo && req.requestDate > requestsDateTo) return false;
      if (requestsStatusFilter && req.status !== requestsStatusFilter)
        return false;
      return true;
    });
  }, [
    pendingRequests,
    requestsDateFrom,
    requestsDateTo,
    requestsStatusFilter,
    requestsUserFilter,
    normalizedRequestsUserSearch
  ]);
  const filteredManagerIncidents = (0, import_react4.useMemo)(() => {
    return pendingIncidentJustifications.filter((req) => {
      if (isCoordinatorManagerView && !hasCoordinatorReviewableIncident(req.incidentFlags ?? null)) {
        return false;
      }
      if (incidentUserFilter && req.userId !== incidentUserFilter) return false;
      if (!incidentUserFilter && normalizedIncidentUserSearch) {
        const displayName = getDisplayUserName(
          req.userId,
          req.userName
        ).toLocaleLowerCase("es-ES");
        if (!displayName.includes(normalizedIncidentUserSearch)) return false;
      }
      if (incidentStatusFilter && req.status !== incidentStatusFilter)
        return false;
      return true;
    });
  }, [
    isCoordinatorManagerView,
    pendingIncidentJustifications,
    incidentStatusFilter,
    incidentUserFilter,
    normalizedIncidentUserSearch
  ]);
  const filteredManagerExclusions = (0, import_react4.useMemo)(() => {
    return pendingUnifiedExclusionRequests.filter((req) => {
      if (requestsUserFilter && req.userId !== requestsUserFilter) return false;
      if (!requestsUserFilter && normalizedRequestsUserSearch) {
        const displayName = getDisplayUserName(
          req.userId,
          req.userName
        ).toLocaleLowerCase("es-ES");
        if (!displayName.includes(normalizedRequestsUserSearch)) return false;
      }
      if (requestsDateFrom && req.requestDate < requestsDateFrom) return false;
      if (requestsDateTo && req.requestDate > requestsDateTo) return false;
      if (requestsStatusFilter && req.status !== requestsStatusFilter)
        return false;
      return true;
    });
  }, [
    pendingUnifiedExclusionRequests,
    requestsDateFrom,
    requestsDateTo,
    requestsStatusFilter,
    requestsUserFilter,
    normalizedRequestsUserSearch
  ]);
  const managerPendingCount = filteredManagerRequests.length;
  const pendingExclusionCount = filteredManagerExclusions.length;
  const managerVisibleTabCount = [
    canReviewAdjustmentRequests,
    canReviewIncidentRequests,
    canViewTeamRecords,
    canReviewExclusionRequests
  ].filter(Boolean).length;
  const managerMenuColsClass = managerVisibleTabCount <= 1 ? "md:grid-cols-1" : managerVisibleTabCount === 2 ? "md:grid-cols-2" : managerVisibleTabCount === 3 ? "md:grid-cols-3" : "md:grid-cols-4";
  const managerOverviewCardCount = [
    canReviewAdjustmentRequests,
    canReviewExclusionRequests,
    canReviewIncidentRequests
  ].filter(Boolean).length;
  const managerOverviewColsClass = managerOverviewCardCount <= 1 ? "md:grid-cols-1" : managerOverviewCardCount === 2 ? "md:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-3";
  (0, import_react4.useEffect)(() => {
    if (!isManagerMode) return;
    const hasPermissionForTab = (tab) => {
      if (tab === "records") return canViewTeamRecords;
      if (tab === "requests") return canReviewAdjustmentRequests;
      if (tab === "incidents") return canReviewIncidentRequests;
      if (tab === "exclusions") return canReviewExclusionRequests;
      return false;
    };
    if (!hasPermissionForTab(managerReviewTab)) {
      if (canViewTeamRecords) setManagerReviewTab("records");
      else if (canReviewAdjustmentRequests) setManagerReviewTab("requests");
      else if (canReviewIncidentRequests) setManagerReviewTab("incidents");
      else if (canReviewExclusionRequests) setManagerReviewTab("exclusions");
    }
  }, [
    isManagerMode,
    canReviewAdjustmentRequests,
    canReviewExclusionRequests,
    canReviewIncidentRequests,
    canViewTeamRecords,
    managerReviewTab
  ]);
  const loadRecords = async (signal) => {
    if (loadRecordsPromiseRef.current) {
      if (!signal) {
        loadRecordsQueuedRef.current = true;
      }
      return loadRecordsPromiseRef.current;
    }
    const loadTask = (async () => {
      setLoading(true);
      try {
        const response = await fetch(endpointBase, { signal });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(
            data.error || `Error ${response.status}: No se pudieron cargar los registros. Data: ${JSON.stringify(data)}`
          );
        }
        setRecords(data.items ?? []);
        lastLoadRecordsErrorRef.current = null;
      } catch (error) {
        if (signal && signal.aborted || error instanceof DOMException && error.name === "AbortError" || error && typeof error === "object" && error.name === "AbortError" || error && typeof error === "object" && String(error.message).toLowerCase().includes("abort") || error && typeof error === "object" && String(error.message).toLowerCase().includes("cleanup")) {
          return;
        }
        const errorMessage = error instanceof Error ? error.message : typeof error === "string" ? error : error && typeof error === "object" && "message" in error ? error.message : "No se pudieron cargar los registros.";
        if (lastLoadRecordsErrorRef.current === errorMessage) {
          return;
        }
        lastLoadRecordsErrorRef.current = errorMessage;
        setToast({
          tone: "error",
          message: errorMessage
        });
      } finally {
        setLoading(false);
      }
    })();
    loadRecordsPromiseRef.current = loadTask;
    try {
      await loadTask;
    } finally {
      loadRecordsPromiseRef.current = null;
      if (loadRecordsQueuedRef.current && !signal?.aborted) {
        loadRecordsQueuedRef.current = false;
        void loadRecords();
      }
    }
  };
  const loadRequests = async () => {
    setRequestsLoading(true);
    try {
      const response = await fetch("/api/time-control/adjustments/me");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "No se pudieron cargar las solicitudes.");
      }
      setRequests(data.items ?? []);
    } catch (error) {
      setToast({
        tone: "error",
        message: error instanceof Error ? error.message : "No se pudieron cargar las solicitudes."
      });
    } finally {
      setRequestsLoading(false);
    }
  };
  const loadIncidentJustifications = async () => {
    if (!isWorkerMode) {
      setIncidentJustifications([]);
      setIncidentJustificationsLoading(false);
      return;
    }
    setIncidentJustificationsLoading(true);
    try {
      const response = await fetch(
        "/api/time-control/incident-justifications/me"
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error ?? "No se pudieron cargar las justificaciones."
        );
      }
      setIncidentJustifications(data.items ?? []);
    } catch (error) {
      setToast({
        tone: "error",
        message: error instanceof Error ? error.message : "No se pudieron cargar las justificaciones."
      });
    } finally {
      setIncidentJustificationsLoading(false);
    }
  };
  const loadMyExclusionRequests = async () => {
    if (!isWorkerMode) {
      setMyRemoteWorkRequests([]);
      setMyPermissionRequests([]);
      setMyExclusionRequestsLoading(false);
      return;
    }
    setMyExclusionRequestsLoading(true);
    try {
      const [remoteResponse, permissionResponse] = await Promise.all([
        fetch("/api/remote-work/me"),
        fetch("/api/permissions/me")
      ]);
      const remoteData = await remoteResponse.json();
      const permissionData = await permissionResponse.json();
      if (!remoteResponse.ok) {
        throw new Error(
          remoteData.error ?? "No se pudieron cargar las solicitudes de teletrabajo."
        );
      }
      if (!permissionResponse.ok) {
        throw new Error(
          permissionData.error ?? "No se pudieron cargar las solicitudes de permiso."
        );
      }
      setMyRemoteWorkRequests(remoteData.items ?? []);
      setMyPermissionRequests(permissionData.items ?? []);
    } catch (error) {
      console.error(
        "Error al cargar solicitudes de teletrabajo/permiso:",
        error
      );
      setMyRemoteWorkRequests([]);
      setMyPermissionRequests([]);
    } finally {
      setMyExclusionRequestsLoading(false);
    }
  };
  const loadPendingRequests = async () => {
    if (!canAccessManagementPanel || !canReviewAdjustmentRequests) {
      setPendingRequests([]);
      setPendingRequestsLoading(false);
      return;
    }
    setPendingRequestsLoading(true);
    try {
      const endpoint = isFunctionalAdmin ? "/api/time-control/adjustments/admin" : "/api/time-control/adjustments/coordinator";
      const response = await fetch(endpoint);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error ?? "No se pudieron cargar las solicitudes pendientes."
        );
      }
      setPendingRequests(data.items ?? []);
    } catch (error) {
      setToast({
        tone: "error",
        message: error instanceof Error ? error.message : "No se pudieron cargar las solicitudes pendientes."
      });
    } finally {
      setPendingRequestsLoading(false);
    }
  };
  const loadPendingIncidentJustifications = async () => {
    if (!canAccessManagementPanel || !canReviewIncidentRequests) {
      setPendingIncidentJustifications([]);
      setPendingIncidentJustificationsLoading(false);
      return;
    }
    setPendingIncidentJustificationsLoading(true);
    try {
      const endpoint = isFunctionalAdmin ? "/api/time-control/incident-justifications/admin" : "/api/time-control/incident-justifications/coordinator";
      const response = await fetch(endpoint);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error ?? "No se pudieron cargar las justificaciones pendientes."
        );
      }
      setPendingIncidentJustifications(data.items ?? []);
    } catch (error) {
      setToast({
        tone: "error",
        message: error instanceof Error ? error.message : "No se pudieron cargar las justificaciones pendientes."
      });
    } finally {
      setPendingIncidentJustificationsLoading(false);
    }
  };
  const loadPendingExclusionRequests = async () => {
    if (!canAccessManagementPanel || !canReviewExclusionRequests) {
      setPendingRemoteWorkRequests([]);
      setPendingPermissionRequests([]);
      setPendingExclusionRequestsLoading(false);
      return;
    }
    setPendingExclusionRequestsLoading(true);
    try {
      const remoteEndpoint = isFunctionalAdmin ? "/api/remote-work/admin-pending" : "/api/remote-work/coordinator";
      const permissionEndpoint = isFunctionalAdmin ? "/api/permissions/admin-pending" : "/api/permissions/coordinator";
      const [remoteResponse, permissionResponse] = await Promise.all([
        fetch(remoteEndpoint),
        fetch(permissionEndpoint)
      ]);
      const remoteData = await remoteResponse.json();
      const permissionData = await permissionResponse.json();
      if (!remoteResponse.ok) {
        throw new Error(
          remoteData.error ?? "No se pudieron cargar solicitudes de teletrabajo."
        );
      }
      if (!permissionResponse.ok) {
        throw new Error(
          permissionData.error ?? "No se pudieron cargar solicitudes de permiso."
        );
      }
      setPendingRemoteWorkRequests(remoteData.items ?? []);
      setPendingPermissionRequests(permissionData.items ?? []);
    } catch (error) {
      console.error(
        "Error al cargar solicitudes pendientes de teletrabajo/permiso:",
        error
      );
      setPendingRemoteWorkRequests([]);
      setPendingPermissionRequests([]);
    } finally {
      setPendingExclusionRequestsLoading(false);
    }
  };
  const loadAllWorkers = async () => {
    if (mode !== "manager") return;
    try {
      const response = await fetch("/api/directory/users");
      const data = await response.json();
      if (!response.ok) {
        return;
      }
      const usersList = Array.isArray(data.items) ? data.items : [];
      const normalized = usersList.map((entry) => ({
        id: String(entry.id ?? ""),
        name: String(entry.name ?? entry.email ?? entry.id ?? "")
      })).filter((entry) => entry.id !== "" && entry.name !== "").sort((left, right) => left.name.localeCompare(right.name));
      setAllWorkers(normalized);
    } catch (error) {
      console.error("Error al cargar trabajadores:", error);
    }
  };
  const loadManagerTodayExclusions = async () => {
    if (!isManagerMode) return;
    try {
      const response = await fetch(
        `/api/time-control/exclusions/today?date=${encodeURIComponent(trackerDate)}`
      );
      const data = await response.json();
      if (!response.ok) {
        return;
      }
      setManagerTodayExclusions({
        vacations: Array.isArray(data.vacations) ? data.vacations : [],
        permissions: Array.isArray(data.permissions) ? data.permissions : [],
        remoteWork: Array.isArray(data.remoteWork) ? data.remoteWork : []
      });
    } catch (error) {
      console.error(
        "Error al cargar exclusiones del seguimiento diario:",
        error
      );
    }
  };
  (0, import_react4.useEffect)(() => {
    const controller = new AbortController();
    void loadRecords(controller.signal);
    return () => {
      controller.abort("cleanup");
    };
  }, [endpointBase]);
  (0, import_react4.useEffect)(() => {
    try {
      const raw = window.localStorage.getItem(viewedTabsStorageKey);
      if (!raw) {
        setViewedTabs([]);
        return;
      }
      const parsed = JSON.parse(raw);
      setViewedTabs(
        Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : []
      );
    } catch {
      setViewedTabs([]);
    }
  }, [viewedTabsStorageKey]);
  (0, import_react4.useEffect)(() => {
    try {
      window.localStorage.setItem(
        viewedTabsStorageKey,
        JSON.stringify(viewedTabs)
      );
    } catch {
    }
  }, [viewedTabs, viewedTabsStorageKey]);
  (0, import_react4.useEffect)(() => {
    try {
      const raw = window.localStorage.getItem(selectedMonthStorageKey);
      if (!raw || !/^\d{4}-\d{2}$/.test(raw)) {
        return;
      }
      setSelectedMonth(raw);
    } catch {
    }
  }, [selectedMonthStorageKey]);
  (0, import_react4.useEffect)(() => {
    try {
      window.localStorage.setItem(selectedMonthStorageKey, selectedMonth);
    } catch {
    }
  }, [selectedMonth, selectedMonthStorageKey]);
  (0, import_react4.useEffect)(() => {
    if (!isWorkerMode) return;
    void loadRequests();
    void loadIncidentJustifications();
    void loadMyExclusionRequests();
  }, [isWorkerMode]);
  (0, import_react4.useEffect)(() => {
    if (!isManagerMode) return;
    void loadPendingRequests();
    void loadPendingIncidentJustifications();
    void loadPendingExclusionRequests();
    void loadAllWorkers();
  }, [
    isManagerMode,
    canAccessManagementPanel,
    canReviewAdjustmentRequests,
    canReviewExclusionRequests,
    canReviewIncidentRequests
  ]);
  (0, import_react4.useEffect)(() => {
    if (!isManagerMode) return;
    void loadManagerTodayExclusions();
  }, [isManagerMode, trackerDate]);
  (0, import_react4.useEffect)(() => {
    setSelectedDetailDate(null);
    setSelectedOverflowDate(null);
  }, [selectedMonth]);
  const readApiErrorMessage = async (response, fallbackMessage) => {
    const responseText = await response.text();
    if (!responseText) {
      return fallbackMessage;
    }
    try {
      const parsed = JSON.parse(responseText);
      return parsed.error ?? fallbackMessage;
    } catch {
      return fallbackMessage;
    }
  };
  const submitAction = async (endpoint, successMessage) => {
    setSubmitting(true);
    showLoadingPopup("Comprobando ubicaci\xF3n...");
    try {
      const location = await getCurrentLocation();
      showLoadingPopup("Registrando fichaje...");
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(location)
      });
      if (!response.ok) {
        const errorMessage = await readApiErrorMessage(
          response,
          "No se pudo completar la operaci\xF3n."
        );
        throw new Error(errorMessage);
      }
      await response.json().catch(() => null);
      hideLoadingPopup();
      setToast({ tone: "success", message: successMessage });
      setShowLocationHelp(false);
      await loadRecords();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "No se pudo completar la operaci\xF3n.";
      if (errorMessage.toLowerCase().includes("ubicaci\xF3n")) {
        setShowLocationHelp(true);
      }
      hideLoadingPopup();
      setToast({
        tone: "error",
        message: errorMessage
      });
    } finally {
      setSubmitting(false);
    }
  };
  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const markTabAsViewed = (tab) => {
    setViewedTabs(
      (current) => current.includes(tab) ? current : [...current, tab]
    );
  };
  const handleTabClick = (tab) => {
    setManagerReviewTab(tab);
    markTabAsViewed(tab);
  };
  const adjustTrackerDate = (days) => {
    const current = new Date(trackerDate);
    current.setDate(current.getDate() + days);
    setTrackerDate(current.toISOString().split("T")[0]);
  };
  const handleWorkerTabClick = (tab) => {
    setWorkerRequestsTab(tab);
    markTabAsViewed(`worker-${tab}`);
  };
  const showLoadingPopup = (message) => {
    setActionPopup({
      tone: "loading",
      message
    });
  };
  const hideLoadingPopup = () => {
    setActionPopup(null);
  };
  const exclusionSummaryText = (0, import_react4.useMemo)(() => {
    const summaryParts = [];
    if (managerTodayExclusions.vacations.length > 0) {
      summaryParts.push(
        `${managerTodayExclusions.vacations.length} vacaci\xF3n${managerTodayExclusions.vacations.length === 1 ? "" : "es"}`
      );
    }
    if (managerTodayExclusions.permissions.length > 0) {
      summaryParts.push(
        `${managerTodayExclusions.permissions.length} permiso${managerTodayExclusions.permissions.length === 1 ? "" : "s"}`
      );
    }
    if (summaryParts.length === 0) {
      return "Sin exclusiones por vacaciones o permisos aprobados.";
    }
    return `Se excluyen ${summaryParts.join(" y ")} aprobados en la fecha seleccionada.`;
  }, [
    managerTodayExclusions.permissions.length,
    managerTodayExclusions.vacations.length
  ]);
  const resetExclusionRequestModal = () => {
    setShowExclusionRequestModal(false);
    setExclusionRequestType("REMOTE_WORK");
    setExclusionRequestDate("");
    setExclusionRequestReason("");
  };
  const submitAdjustmentRequest = async () => {
    setRequestSubmitting(true);
    showLoadingPopup("Enviando solicitud...");
    try {
      const trimmedReason = requestReason.trim();
      if (!trimmedReason) {
        throw new Error("Debes indicar un motivo para la solicitud.");
      }
      const response = await fetch("/api/time-control/adjustments/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          requestType,
          requestedTime: normalizeDateTimeLocalToSql(requestedTime),
          reason: trimmedReason
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo crear la solicitud.");
      }
      setRequestReason("");
      setRequestedTime("");
      setRequestType("CHECK_IN");
      setShowRequestModal(false);
      hideLoadingPopup();
      setToast({
        tone: "success",
        message: "Solicitud enviada correctamente."
      });
      await loadRequests();
    } catch (error) {
      hideLoadingPopup();
      setToast({
        tone: "error",
        message: error instanceof Error ? error.message : "No se pudo crear la solicitud."
      });
    } finally {
      setRequestSubmitting(false);
    }
  };
  const submitExclusionRequest = async () => {
    setExclusionRequestSubmitting(true);
    showLoadingPopup("Enviando solicitud...");
    try {
      const trimmedReason = exclusionRequestReason.trim();
      if (!exclusionRequestDate) {
        throw new Error("Debes indicar una fecha.");
      }
      if (exclusionRequestDate < todaySqlDate) {
        throw new Error(
          "No se puede solicitar teletrabajo o permiso en d\xEDas anteriores."
        );
      }
      if (!trimmedReason) {
        throw new Error("Debes indicar un motivo.");
      }
      const isRemoteWork = exclusionRequestType === "REMOTE_WORK";
      const endpoint = isRemoteWork ? "/api/remote-work/request" : "/api/permissions/request";
      const body = isRemoteWork ? {
        remoteWorkDate: exclusionRequestDate,
        reason: trimmedReason
      } : {
        permissionDate: exclusionRequestDate,
        reason: trimmedReason
      };
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo enviar la solicitud.");
      }
      resetExclusionRequestModal();
      hideLoadingPopup();
      setToast({
        tone: "success",
        message: "Solicitud enviada correctamente."
      });
      await loadMyExclusionRequests();
    } catch (error) {
      hideLoadingPopup();
      setToast({
        tone: "error",
        message: error instanceof Error ? error.message : "No se pudo enviar la solicitud."
      });
    } finally {
      setExclusionRequestSubmitting(false);
    }
  };
  const reviewExclusionRequest = async (request, status) => {
    setReviewSubmittingId(request.id);
    showLoadingPopup(
      status === "APPROVED" ? "Aprobando solicitud..." : "Rechazando solicitud..."
    );
    try {
      const trimmedReviewComment = (reviewComments[request.id] ?? "").trim();
      if (status === "REJECTED" && !trimmedReviewComment) {
        throw new Error("Debes indicar un motivo para rechazar la solicitud.");
      }
      const isCoordinatorStep = request.status === "PENDING_COORDINATOR";
      const endpoint = request.kind === "REMOTE_WORK" ? isCoordinatorStep ? `/api/remote-work/${request.id}/review-coordinator` : `/api/remote-work/${request.id}/review-admin` : isCoordinatorStep ? `/api/permissions/${request.id}/review-coordinator` : `/api/permissions/${request.id}/review-admin`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status,
          comment: trimmedReviewComment
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo revisar la solicitud.");
      }
      setReviewComments((current) => ({
        ...current,
        [request.id]: ""
      }));
      hideLoadingPopup();
      setToast({
        tone: "success",
        message: status === "APPROVED" ? isCoordinatorStep ? "Solicitud enviada a administraci\xF3n." : "Solicitud aprobada correctamente." : "Solicitud rechazada correctamente."
      });
      await Promise.all([
        loadPendingExclusionRequests(),
        loadMyExclusionRequests(),
        loadManagerTodayExclusions()
      ]);
    } catch (error) {
      hideLoadingPopup();
      setToast({
        tone: "error",
        message: error instanceof Error ? error.message : "No se pudo revisar la solicitud."
      });
    } finally {
      setReviewSubmittingId(null);
    }
  };
  const submitIncidentJustification = async () => {
    if (!selectedIncidentRecordId) {
      return;
    }
    setIncidentJustificationSubmitting(true);
    showLoadingPopup("Enviando justificaci\xF3n...");
    try {
      const trimmedReason = incidentJustificationReason.trim();
      if (!trimmedReason) {
        throw new Error(
          "Debes indicar un motivo para justificar la incidencia."
        );
      }
      const response = await fetch(
        "/api/time-control/incident-justifications/request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            recordId: selectedIncidentRecordId,
            reason: trimmedReason
          })
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error ?? "No se pudo enviar la justificaci\xF3n de incidencia."
        );
      }
      setSelectedIncidentRecordId(null);
      setIncidentJustificationReason("");
      hideLoadingPopup();
      setToast({
        tone: "success",
        message: "Justificaci\xF3n enviada correctamente."
      });
      await loadIncidentJustifications();
    } catch (error) {
      hideLoadingPopup();
      setToast({
        tone: "error",
        message: error instanceof Error ? error.message : "No se pudo enviar la justificaci\xF3n de incidencia."
      });
    } finally {
      setIncidentJustificationSubmitting(false);
    }
  };
  const deleteIncidentJustification = async () => {
    if (!incidentJustificationToDelete) {
      return;
    }
    setDeletingIncidentJustificationId(incidentJustificationToDelete.id);
    showLoadingPopup("Ocultando notificaci\xF3n...");
    try {
      const response = await fetch(
        `/api/time-control/incident-justifications/${incidentJustificationToDelete.id}`,
        {
          method: "DELETE"
        }
      );
      if (!response.ok) {
        throw new Error(
          await readApiErrorMessage(
            response,
            "No se pudo ocultar la notificaci\xF3n."
          )
        );
      }
      const hiddenAt = (/* @__PURE__ */ new Date()).toISOString().slice(0, 23).replace("T", " ");
      setIncidentJustifications(
        (current) => current.map(
          (justification) => justification.id === incidentJustificationToDelete.id ? { ...justification, hiddenByWorkerAt: hiddenAt } : justification
        )
      );
      setDismissedApprovedIncidentRecordIds(
        (current) => current.includes(incidentJustificationToDelete.recordId) ? current : [...current, incidentJustificationToDelete.recordId]
      );
      setIncidentJustificationToDelete(null);
      hideLoadingPopup();
      setToast({
        tone: "success",
        message: "Elemento ocultado correctamente."
      });
      await loadIncidentJustifications();
    } catch (error) {
      hideLoadingPopup();
      setToast({
        tone: "error",
        message: error instanceof Error ? error.message : "No se pudo ocultar el elemento."
      });
    } finally {
      setDeletingIncidentJustificationId(null);
    }
  };
  const deleteAdjustmentRequest = async () => {
    if (!adjustmentRequestToDelete) {
      return;
    }
    setDeletingAdjustmentRequestId(adjustmentRequestToDelete.id);
    showLoadingPopup("Ocultando solicitud...");
    try {
      const response = await fetch(
        `/api/time-control/adjustments/${adjustmentRequestToDelete.id}`,
        {
          method: "DELETE"
        }
      );
      if (!response.ok) {
        throw new Error(
          await readApiErrorMessage(
            response,
            "No se pudo ocultar la solicitud."
          )
        );
      }
      const hiddenAt = (/* @__PURE__ */ new Date()).toISOString().slice(0, 23).replace("T", " ");
      setRequests(
        (current) => current.map(
          (request) => request.id === adjustmentRequestToDelete.id ? { ...request, hiddenByWorkerAt: hiddenAt } : request
        )
      );
      setAdjustmentRequestToDelete(null);
      hideLoadingPopup();
      setToast({
        tone: "success",
        message: "Solicitud ocultada correctamente."
      });
      await loadRequests();
    } catch (error) {
      hideLoadingPopup();
      setToast({
        tone: "error",
        message: error instanceof Error ? error.message : "No se pudo ocultar la solicitud."
      });
    } finally {
      setDeletingAdjustmentRequestId(null);
    }
  };
  const reviewRequest = async (requestId, status) => {
    setReviewSubmittingId(requestId);
    showLoadingPopup(
      status === "APPROVED" ? "Aprobando solicitud..." : "Rechazando solicitud..."
    );
    try {
      const trimmedReviewComment = (reviewComments[requestId] ?? "").trim();
      if (status === "REJECTED" && !trimmedReviewComment) {
        throw new Error("Debes indicar un motivo para rechazar la solicitud.");
      }
      const request = pendingRequests.find((r) => r.id === requestId);
      const isLegacyCoordinatorPending = request?.status === "PENDING_COORDINATOR";
      const endpoint = `/api/time-control/adjustments/${requestId}/review-admin`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status,
          comment: trimmedReviewComment
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo revisar la solicitud.");
      }
      hideLoadingPopup();
      setToast({
        tone: "success",
        message: status === "APPROVED" ? isLegacyCoordinatorPending ? "Solicitud antigua aprobada correctamente." : "Solicitud aprobada correctamente." : "Solicitud rechazada correctamente."
      });
      setReviewComments((current) => ({
        ...current,
        [requestId]: ""
      }));
      await Promise.all([loadPendingRequests(), loadRequests()]);
    } catch (error) {
      hideLoadingPopup();
      setToast({
        tone: "error",
        message: error instanceof Error ? error.message : "No se pudo revisar la solicitud."
      });
    } finally {
      setReviewSubmittingId(null);
    }
  };
  const reviewIncidentJustification = async (justificationId, status) => {
    setReviewSubmittingId(justificationId);
    showLoadingPopup(
      status === "APPROVED" ? "Aprobando justificaci\xF3n..." : "Rechazando justificaci\xF3n..."
    );
    try {
      const trimmedReviewComment = (reviewComments[justificationId] ?? "").trim();
      if (status === "REJECTED" && !trimmedReviewComment) {
        throw new Error(
          "Debes indicar un motivo para rechazar la justificaci\xF3n."
        );
      }
      const justification = pendingIncidentJustifications.find(
        (entry) => entry.id === justificationId
      );
      const isLegacyCoordinatorPending = justification?.status === "PENDING_COORDINATOR";
      const endpoint = `/api/time-control/incident-justifications/${justificationId}/review-admin`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status,
          comment: trimmedReviewComment
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo revisar la justificaci\xF3n.");
      }
      hideLoadingPopup();
      setToast({
        tone: "success",
        message: status === "APPROVED" ? isLegacyCoordinatorPending ? "Justificaci\xF3n antigua aprobada correctamente." : "Justificaci\xF3n aprobada correctamente." : "Justificaci\xF3n rechazada correctamente."
      });
      setReviewComments((current) => ({
        ...current,
        [justificationId]: ""
      }));
      await Promise.all([
        loadPendingIncidentJustifications(),
        loadIncidentJustifications()
      ]);
    } catch (error) {
      hideLoadingPopup();
      setToast({
        tone: "error",
        message: error instanceof Error ? error.message : "No se pudo revisar la justificaci\xF3n."
      });
    } finally {
      setReviewSubmittingId(null);
    }
  };
  const applyUpdatedRecord = (updatedRecord) => {
    setRecords(
      (current) => current.map(
        (record) => record.id === updatedRecord.id ? updatedRecord : record
      )
    );
    setSelectedRecordForDetail(
      (current) => current?.id === updatedRecord.id ? updatedRecord : current
    );
  };
  const reviewRecordAdminValidation = async (recordId, status) => {
    setReviewSubmittingId(recordId);
    showLoadingPopup(
      status === "APPROVED" ? "Validando fichaje..." : "Rechazando validaci\xF3n..."
    );
    try {
      const trimmedReviewComment = (reviewComments[recordId] ?? "").trim();
      if (status === "REJECTED" && !trimmedReviewComment) {
        throw new Error("Debes indicar un motivo para rechazar el fichaje.");
      }
      const response = await fetch(
        `/api/time-control/records/${recordId}/admin-validation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            status,
            comment: trimmedReviewComment
          })
        }
      );
      if (!response.ok) {
        throw new Error(
          await readApiErrorMessage(response, "No se pudo revisar el fichaje.")
        );
      }
      const data = await response.json();
      if (data.item) {
        applyUpdatedRecord(data.item);
      }
      setReviewComments((current) => ({
        ...current,
        [recordId]: ""
      }));
      await loadRecords();
      hideLoadingPopup();
      setToast({
        tone: "success",
        message: status === "APPROVED" ? "Fichaje validado correctamente." : "Fichaje rechazado correctamente."
      });
    } catch (error) {
      hideLoadingPopup();
      setToast({
        tone: "error",
        message: error instanceof Error ? error.message : "No se pudo revisar el fichaje."
      });
    } finally {
      setReviewSubmittingId(null);
    }
  };
  const renderRecordAdminValidationPanel = (record) => {
    if (!isManagerMode || !isFunctionalAdmin || !isPendingAdminValidation(record)) {
      return null;
    }
    return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "mt-4 rounded-2xl border border-sky-100 bg-sky-50/50 p-4 shadow-sm backdrop-blur-sm transition-all hover:shadow-md", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex flex-col gap-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "inline-flex rounded-lg bg-sky-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white shadow-sm shadow-sky-500/20", children: "Revisi\xF3n administrativa" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-xs font-medium text-sky-900/80 leading-relaxed mt-1", children: "Confirma la validez de la ubicaci\xF3n externa del fichaje o rech\xE1zala indicando un motivo." })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "mt-3.5 relative", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
        "textarea",
        {
          className: "h-24 w-full resize-none rounded-xl border border-sky-100 bg-white/80 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-500/10 shadow-inner",
          placeholder: "A\xF1ade un comentario para la revisi\xF3n (obligatorio al rechazar)...",
          value: reviewComments[record.id] ?? "",
          onChange: (event) => setReviewComments((current) => ({
            ...current,
            [record.id]: event.target.value
          }))
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "mt-3 flex items-center justify-end gap-2.5 border-t border-sky-100/50 pt-3", children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
          "button",
          {
            type: "button",
            className: `${POPUP_DANGER_BUTTON_CLASS} cursor-pointer text-xs active:scale-95 disabled:cursor-not-allowed disabled:opacity-50`,
            onClick: () => reviewRecordAdminValidation(record.id, "REJECTED"),
            disabled: reviewSubmittingId === record.id,
            children: "Rechazar"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
          "button",
          {
            type: "button",
            className: `${POPUP_PRIMARY_BUTTON_CLASS} cursor-pointer text-xs active:scale-95 disabled:cursor-not-allowed disabled:opacity-50`,
            onClick: () => reviewRecordAdminValidation(record.id, "APPROVED"),
            disabled: reviewSubmittingId === record.id,
            children: "Validar"
          }
        )
      ] })
    ] });
  };
  const renderQuickActionsCard = (layout = "desktop") => {
    const wrapperClass = layout === "mobile" ? "rounded-xl border border-slate-200 bg-slate-50 p-3" : "w-[180px] rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-sm";
    const gridClass = layout === "mobile" ? "grid grid-cols-3 gap-2" : "grid grid-cols-1 gap-2";
    return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: wrapperClass, children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "mb-3 text-[10px] font-medium text-slate-400", children: "Acciones r\xE1pidas" }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: gridClass, children: [
        isWorkerMode ? !openRecord ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
          "button",
          {
            className: "flex flex-col items-center gap-2 rounded-lg border-0 bg-slate-900 px-2 py-3 text-center transition hover:bg-slate-700 disabled:opacity-50",
            onClick: () => submitAction(
              "/api/time-control/check-in",
              "Entrada registrada correctamente."
            ),
            disabled: submitting,
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                "i",
                {
                  className: "ti ti-login-2 text-[22px] text-white",
                  "aria-hidden": "true"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "text-[11px] leading-tight text-white", children: "Fichar entrada" })
            ]
          }
        ) : /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
          "button",
          {
            className: "flex flex-col items-center gap-2 rounded-lg border border-rose-200 bg-white px-2 py-3 text-center transition hover:bg-rose-50 disabled:opacity-50",
            onClick: () => submitAction(
              "/api/time-control/check-out",
              "Salida registrada correctamente."
            ),
            disabled: submitting,
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                "i",
                {
                  className: "ti ti-logout-2 text-[22px] text-rose-600",
                  "aria-hidden": "true"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "text-[11px] leading-tight text-rose-700", children: "Fichar salida" })
            ]
          }
        ) : null,
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
          "button",
          {
            className: "flex flex-col items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-3 text-center transition hover:border-slate-300 hover:bg-slate-50",
            onClick: () => setShowRequestModal(true),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                "i",
                {
                  className: "ti ti-edit text-[22px] text-slate-600",
                  "aria-hidden": "true"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "text-[11px] leading-tight text-slate-600", children: "Solicitar fichaje" })
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
          "button",
          {
            className: "flex flex-col items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-3 text-center transition hover:border-slate-300 hover:bg-slate-50",
            onClick: () => setShowLocationHelp(true),
            disabled: submitting,
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                "i",
                {
                  className: "ti ti-map-pin text-[22px] text-slate-600",
                  "aria-hidden": "true"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "text-[11px] leading-tight text-slate-600", children: "Ayuda ubicaci\xF3n" })
            ]
          }
        )
      ] })
    ] });
  };
  const renderRecordDetailContent = (record) => {
    const trustLevel = getDisplayTrustLevel(record);
    const trustLabel = getDisplayTrustLabel(record);
    const trustClass = TRUST_LEVEL_CLASSES[trustLevel];
    const hasIncident = record.status === "INCIDENT";
    const displayStatus = STATUS_LABELS[getDisplayRecordStatus(record)];
    const expectedMinutes = 480;
    const workedPercent = Math.min(
      100,
      Math.round(record.workedMinutes / expectedMinutes * 100)
    );
    const getMapsUrl = (lat, lng) => {
      if (lat === null || lng === null) return "";
      return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    };
    return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "space-y-5 text-left", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "relative overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm", children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3", children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "text-[11px] font-bold uppercase tracking-wider text-slate-400", children: "Fecha de jornada" }),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("h4", { className: "mt-0.5 text-base font-semibold text-slate-800", children: formatShortDate(record.workDate) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex items-center gap-1.5 font-sans", children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
              "span",
              {
                className: `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ${CALENDAR_STATUS_BADGE_CLASSES[getDisplayRecordStatus(record)]}`,
                children: displayStatus
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
              "span",
              {
                className: `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ${trustClass}`,
                title: getTrustTooltip(record),
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                    "svg",
                    {
                      className: "mr-1 h-3 w-3",
                      fill: "none",
                      stroke: "currentColor",
                      viewBox: "0 0 24 24",
                      children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                        "path",
                        {
                          strokeLinecap: "round",
                          strokeLinejoin: "round",
                          strokeWidth: "2.5",
                          d: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        }
                      )
                    }
                  ),
                  trustLabel
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center", children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "text-[11px] font-bold uppercase tracking-wider text-slate-400", children: "Rango horario" }),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "mt-0.5 flex items-center gap-1.5", children: [
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                "svg",
                {
                  className: "h-4 w-4 shrink-0 text-slate-400",
                  fill: "none",
                  stroke: "currentColor",
                  viewBox: "0 0 24 24",
                  children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                    "path",
                    {
                      strokeLinecap: "round",
                      strokeLinejoin: "round",
                      strokeWidth: "2",
                      d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    }
                  )
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "font-mono text-xl font-bold tracking-tight text-slate-800", children: getRecordLine(record) })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "shrink-0 sm:text-right", children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "text-[11px] font-bold uppercase tracking-wider text-slate-400", children: "Tiempo computado" }),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "mt-0.5 font-mono text-2xl font-black tracking-tight text-slate-900", children: formatHoursFromMinutes(record.workedMinutes) })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "mt-4", children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "mb-1 flex items-center justify-between text-[11px] font-medium text-slate-400", children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { children: "Progreso de jornada" }),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { className: "font-semibold text-slate-600", children: [
              workedPercent,
              "% del objetivo"
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
            "div",
            {
              className: `h-full rounded-full transition-all duration-500 bg-gradient-to-r ${record.status === "INCIDENT" ? "from-rose-400 to-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]" : record.status === "COMPLETED" ? "from-emerald-400 to-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" : "from-sky-400 to-sky-500 shadow-[0_0_8px_rgba(56,189,248,0.3)]"}`,
              style: { width: `${workedPercent}%` }
            }
          ) })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "space-y-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm", children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex items-center justify-between gap-3", children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("h5", { className: "text-xs font-bold uppercase tracking-widest text-slate-400", children: "Registro de eventos" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "text-xs text-slate-400", children: "Datos t\xE9cnicos plegables" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "space-y-3", children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-3", children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
              /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-emerald-50 shadow-sm", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "h-1.5 w-1.5 rounded-full bg-white" }) }),
                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "text-xs font-bold uppercase tracking-wider text-emerald-700", children: "Entrada registrada" }),
                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "rounded bg-white px-2 py-0.5 text-[11px] font-bold text-slate-500", children: record.checkInDeviceType || "Dispositivo" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "font-mono text-lg font-bold text-slate-800", children: formatTimeOnly(record.checkInAt) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("details", { className: "group mt-2", children: [
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("summary", { className: "cursor-pointer list-none text-xs font-semibold text-slate-500 transition hover:text-sky-700", children: "Ver datos t\xE9cnicos de entrada" }),
              /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "mt-2 space-y-2 rounded-xl border border-slate-200 bg-white/90 p-3 text-xs text-slate-600", children: [
                /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("p", { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "font-semibold text-slate-700", children: "IP:" }),
                  " ",
                  record.checkInIpAddress || "\u2014"
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex flex-wrap items-center gap-2", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "font-semibold text-slate-700", children: "Ubicaci\xF3n:" }),
                  record.checkInLatitude !== null && record.checkInLongitude !== null ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
                    "a",
                    {
                      href: getMapsUrl(
                        record.checkInLatitude,
                        record.checkInLongitude
                      ),
                      target: "_blank",
                      rel: "noopener noreferrer",
                      className: "inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-700 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700",
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
                          "svg",
                          {
                            className: "mr-1 h-3.5 w-3.5 shrink-0 text-slate-400",
                            fill: "none",
                            stroke: "currentColor",
                            viewBox: "0 0 24 24",
                            children: [
                              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                "path",
                                {
                                  strokeLinecap: "round",
                                  strokeLinejoin: "round",
                                  strokeWidth: "2",
                                  d: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                }
                              ),
                              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                "path",
                                {
                                  strokeLinecap: "round",
                                  strokeLinejoin: "round",
                                  strokeWidth: "2",
                                  d: "M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                }
                              )
                            ]
                          }
                        ),
                        record.checkInLatitude.toFixed(6),
                        ",",
                        " ",
                        record.checkInLongitude.toFixed(6)
                      ]
                    }
                  ) : /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "text-slate-400", children: "\u2014" })
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "rounded-xl border border-rose-100 bg-rose-50/30 px-4 py-3", children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
              /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "flex h-4 w-4 items-center justify-center rounded-full bg-rose-400 ring-4 ring-rose-50 shadow-sm", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "h-1.5 w-1.5 rounded-full bg-white" }) }),
                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "text-xs font-bold uppercase tracking-wider text-rose-600", children: "Salida registrada" }),
                record.checkOutAt ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "rounded bg-white px-2 py-0.5 text-[11px] font-bold text-slate-500", children: record.checkOutDeviceType || "Dispositivo" }) : null
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "font-mono text-lg font-bold text-slate-800", children: record.checkOutAt ? formatTimeOnly(record.checkOutAt) : "Sin registrar" })
            ] }),
            record.checkOutAt ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("details", { className: "group mt-2", children: [
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("summary", { className: "cursor-pointer list-none text-xs font-semibold text-slate-500 transition hover:text-sky-700", children: "Ver datos t\xE9cnicos de salida" }),
              /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "mt-2 space-y-2 rounded-xl border border-slate-200 bg-white/90 p-3 text-xs text-slate-600", children: [
                /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("p", { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "font-semibold text-slate-700", children: "IP:" }),
                  " ",
                  record.checkOutIpAddress || "\u2014"
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex flex-wrap items-center gap-2", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "font-semibold text-slate-700", children: "Ubicaci\xF3n:" }),
                  record.checkOutLatitude !== null && record.checkOutLongitude !== null ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
                    "a",
                    {
                      href: getMapsUrl(
                        record.checkOutLatitude,
                        record.checkOutLongitude
                      ),
                      target: "_blank",
                      rel: "noopener noreferrer",
                      className: "inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-700 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700",
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
                          "svg",
                          {
                            className: "mr-1 h-3.5 w-3.5 shrink-0 text-slate-400",
                            fill: "none",
                            stroke: "currentColor",
                            viewBox: "0 0 24 24",
                            children: [
                              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                "path",
                                {
                                  strokeLinecap: "round",
                                  strokeLinejoin: "round",
                                  strokeWidth: "2",
                                  d: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                }
                              ),
                              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                "path",
                                {
                                  strokeLinecap: "round",
                                  strokeLinejoin: "round",
                                  strokeWidth: "2",
                                  d: "M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                }
                              )
                            ]
                          }
                        ),
                        record.checkOutLatitude.toFixed(6),
                        ",",
                        " ",
                        record.checkOutLongitude.toFixed(6)
                      ]
                    }
                  ) : /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "text-slate-400", children: "\u2014" })
                ] })
              ] })
            ] }) : null
          ] })
        ] })
      ] }),
      hasIncident && /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex items-start rounded-2xl border border-rose-100 bg-rose-50/40 p-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
          "svg",
          {
            className: "mr-3 mt-0.5 h-5 w-5 shrink-0 text-rose-500",
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
            children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
              "path",
              {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: "2",
                d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              }
            )
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("h6", { className: "text-xs font-bold uppercase tracking-wider text-rose-700", children: "Detalles de la incidencia" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "mt-1 text-sm font-medium leading-relaxed text-rose-900", children: getStatusDetail(record) })
        ] })
      ] }),
      renderRecordAdminValidationPanel(record)
    ] });
  };
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_jsx_runtime9.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("style", { children: `
          @keyframes tcTabFadeSlide {
            from {
              opacity: 0;
              transform: translateY(4px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        ` }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      "section",
      {
        className: `relative ${showWorkerOverview ? "flex flex-col gap-6 xl:flex-row xl:items-start" : "space-y-4"}`,
        children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex-1 min-w-0 space-y-4 overflow-visible", children: [
          headerSlot ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "relative", children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "min-w-0 xl:pr-[140px]", children: headerSlot }),
            showWorkerOverview ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "hidden xl:block absolute top-2 -right-48 z-10", children: renderQuickActionsCard("desktop") }) : null
          ] }) : showWorkerOverview ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "hidden xl:flex justify-end", children: renderQuickActionsCard("desktop") }) : null,
          isWorkerMode ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_jsx_runtime9.Fragment, { children: [
            showWorkerOverview ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_jsx_runtime9.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex flex-col sm:flex-row items-stretch gap-4 mb-6 w-full", children: [
                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "relative flex-1 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-between", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex items-center justify-between gap-4", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { children: [
                    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-xs font-semibold uppercase tracking-wider text-slate-400", children: "Estado de hoy" }),
                    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "mt-2 flex items-center gap-2", children: [
                      openRecord && /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { className: "relative flex h-2.5 w-2.5", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" }),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" })
                      ] }),
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-xl font-bold tracking-tight text-slate-900", children: openRecord ? "Jornada abierta" : "Sin jornada abierta" })
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "mt-1 text-xs font-medium text-slate-500", children: openRecord ? `Abierta desde ${formatDateTime(openRecord.checkInAt)}.` : "\xDAltima entrada registrada." })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                    "div",
                    {
                      className: `flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${openRecord ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"}`,
                      children: openRecord ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                        "svg",
                        {
                          xmlns: "http://www.w3.org/2000/svg",
                          fill: "none",
                          viewBox: "0 0 24 24",
                          strokeWidth: 2,
                          stroke: "currentColor",
                          className: "w-6 h-6",
                          children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                            "path",
                            {
                              strokeLinecap: "round",
                              strokeLinejoin: "round",
                              d: "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                            }
                          )
                        }
                      ) : /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                        "svg",
                        {
                          xmlns: "http://www.w3.org/2000/svg",
                          fill: "none",
                          viewBox: "0 0 24 24",
                          strokeWidth: 2,
                          stroke: "currentColor",
                          className: "w-6 h-6",
                          children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                            "path",
                            {
                              strokeLinecap: "round",
                              strokeLinejoin: "round",
                              d: "M14.25 9v6m-4.5 0V9M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                            }
                          )
                        }
                      )
                    }
                  )
                ] }) }),
                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "relative flex-1 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-between", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex items-center justify-between gap-4", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { children: [
                    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("p", { className: "text-xs font-semibold uppercase tracking-wider text-slate-400", children: [
                      "Horas totales en ",
                      formatMonthLabel(selectedMonth)
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "mt-2 text-3xl font-bold tracking-tight text-slate-900", children: formatHoursFromMinutes(
                      totalWorkedMinutesInMonth
                    ) })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                    "svg",
                    {
                      xmlns: "http://www.w3.org/2000/svg",
                      fill: "none",
                      viewBox: "0 0 24 24",
                      strokeWidth: 2,
                      stroke: "currentColor",
                      className: "w-6 h-6",
                      children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                        "path",
                        {
                          strokeLinecap: "round",
                          strokeLinejoin: "round",
                          d: "M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                        }
                      )
                    }
                  ) })
                ] }) })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "space-y-4", children: [
                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "xl:hidden", children: renderQuickActionsCard("mobile") }),
                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "rounded-xl border border-slate-200 bg-white p-5 shadow-sm", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "border-t border-slate-100 pt-5", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "mb-4 flex flex-wrap items-start justify-between gap-3", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "space-y-1", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("h4", { className: "text-sm font-semibold text-slate-900", children: "Hist\xF3rico de fichajes" }),
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm text-slate-600", children: "Aqu\xED puedes consultar los fichajes del mes seleccionado, incluidos los realizados en fin de semana." })
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex items-center gap-1 self-start", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                        Button,
                        {
                          variant: "secondary",
                          onClick: () => setSelectedMonth(
                            (current) => shiftMonthValue(current, -1)
                          ),
                          children: "<"
                        }
                      ),
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "min-w-[132px] text-center text-sm font-medium text-slate-700", children: formatMonthLabel(selectedMonth) }),
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                        Button,
                        {
                          variant: "secondary",
                          onClick: () => setSelectedMonth(
                            (current) => shiftMonthValue(current, 1)
                          ),
                          children: ">"
                        }
                      )
                    ] })
                  ] }),
                  loading ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm text-slate-500", children: "Cargando registros..." }) : /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "space-y-4", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex flex-wrap items-center gap-4 text-xs text-slate-600", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { className: "inline-flex items-center gap-2", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "h-2.5 w-2.5 rounded-full bg-emerald-500" }),
                        "Completado"
                      ] }),
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { className: "inline-flex items-center gap-2", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "h-2.5 w-2.5 rounded-full bg-rose-500" }),
                        "Incidencia"
                      ] }),
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { className: "inline-flex items-center gap-2", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "h-2.5 w-2.5 rounded-full bg-amber-500" }),
                        "Abierta"
                      ] }),
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { className: "inline-flex items-center gap-2", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "h-2.5 w-2.5 rounded-full bg-slate-400" }),
                        "Ausente"
                      ] }),
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { className: "inline-flex items-center gap-2", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "h-2.5 w-2.5 rounded-full bg-slate-200 border border-slate-300" }),
                        "Fin de semana"
                      ] })
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "overflow-x-auto pb-4 custom-scrollbar scrollbar-hide", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "min-w-[600px] lg:min-w-full space-y-3", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "grid grid-cols-7 gap-1.5 sm:gap-3", children: CALENDAR_WEEKDAY_LABELS.map(
                        (label, index) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                          "div",
                          {
                            className: `text-center text-xs font-semibold uppercase tracking-wide ${index >= 5 ? "text-rose-500" : "text-slate-500"}`,
                            children: label
                          },
                          label
                        )
                      ) }),
                      calendarWeeks.map((week, weekIndex) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                        "div",
                        {
                          className: "grid grid-cols-7 gap-1.5 sm:gap-3",
                          children: week.map((cell, cellIndex) => {
                            if (!cell.workDate || cell.dayNumber === null) {
                              return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                "div",
                                {
                                  className: "min-h-[120px] rounded-2xl border border-transparent bg-transparent"
                                },
                                `empty-${weekIndex}-${cellIndex}`
                              );
                            }
                            const hasDetail = cell.records.length > 0;
                            const primaryStatus = getPrimaryDayStatus(
                              cell.records
                            );
                            const visibleRecords = cell.records.slice(
                              0,
                              2
                            );
                            const hiddenRecordsCount = Math.max(
                              cell.records.length - visibleRecords.length,
                              0
                            );
                            const baseCellClass = getCalendarCellClasses(
                              cell.isWeekend,
                              cell.isToday
                            );
                            return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
                              "div",
                              {
                                className: `min-h-[90px] sm:min-h-[120px] rounded-xl sm:rounded-2xl border p-1.5 sm:p-3 shadow-sm ${baseCellClass} ${hasDetail ? "cursor-pointer transition hover:bg-slate-50/40 hover:ring-2 hover:ring-slate-200 hover:shadow-md" : ""}`,
                                onClick: () => hasDetail ? setSelectedDetailDate(
                                  cell.workDate
                                ) : void 0,
                                children: [
                                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "mb-2 flex justify-center", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex flex-col items-center text-center", children: [
                                    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "text-xs sm:text-sm font-semibold text-slate-900", children: String(
                                      cell.dayNumber
                                    ).padStart(2, "0") }),
                                    cell.isToday ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                      "span",
                                      {
                                        className: `text-[9px] sm:text-[11px] font-medium ${cell.isWeekend ? "text-violet-600" : "text-violet-600"}`,
                                        children: "hoy"
                                      }
                                    ) : null
                                  ] }) }),
                                  cell.records.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "h-[40px] sm:h-[68px]" }) : /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "space-y-2", children: [
                                    visibleRecords.map((record) => /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
                                      "div",
                                      {
                                        className: `rounded-md sm:rounded-xl px-1 py-0.5 sm:px-2 sm:py-1.5 leading-tight transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${getCalendarRecordClasses(
                                          record,
                                          cell.isWeekend
                                        )}`,
                                        children: [
                                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "text-[8px] sm:text-[10px] font-semibold tracking-tight opacity-90 truncate", children: getRecordLine(record) }),
                                          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "mt-0.5 sm:mt-1 flex items-center gap-1 sm:gap-1.5 min-w-0", children: [
                                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                              "span",
                                              {
                                                className: `h-1 w-1 sm:h-1.5 sm:w-1.5 flex-shrink-0 rounded-full ${getRecordDotClass(
                                                  record
                                                )}`
                                              }
                                            ),
                                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "truncate text-[8px] sm:text-[9px] font-medium opacity-80", children: STATUS_LABELS[getDisplayRecordStatus(
                                              record
                                            )] })
                                          ] })
                                        ]
                                      },
                                      record.id
                                    )),
                                    hiddenRecordsCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
                                      "button",
                                      {
                                        type: "button",
                                        onClick: (event) => {
                                          event.stopPropagation();
                                          setSelectedOverflowDate(
                                            cell.workDate
                                          );
                                        },
                                        className: `rounded-lg border border-dashed px-1 py-0.5 text-center text-[8px] sm:text-[10px] font-normal w-full ${cell.isWeekend ? "border-slate-300 bg-white text-slate-500" : "border-slate-200 bg-white text-slate-500"}`,
                                        children: [
                                          "+",
                                          hiddenRecordsCount
                                        ]
                                      }
                                    ) : null
                                  ] })
                                ]
                              },
                              cell.workDate
                            );
                          })
                        },
                        `week-${weekIndex}`
                      ))
                    ] }) }),
                    filteredRecords.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm text-slate-500", children: "No hay fichajes registrados para el mes seleccionado." }) : null
                  ] })
                ] }) })
              ] })
            ] }) : null,
            showWorkerRequests ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-8", children: [
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "border-b border-slate-100 bg-white p-1.5", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "grid grid-cols-2 gap-1 md:grid-cols-2", children: [
                /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
                  "button",
                  {
                    type: "button",
                    onClick: () => {
                      handleWorkerTabClick("requests");
                    },
                    className: `flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 ${workerRequestsTab === "requests" ? "bg-slate-900 text-white shadow-sm" : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`,
                    children: [
                      "Fichajes",
                      !viewedTabs.includes("worker-requests") && requests.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                        "span",
                        {
                          className: `rounded-full px-2 py-0.5 text-xs transition-opacity duration-300 ${workerRequestsTab === "requests" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`,
                          children: requests.length
                        }
                      ) : null
                    ]
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
                  "button",
                  {
                    type: "button",
                    onClick: () => {
                      handleWorkerTabClick("incidents");
                    },
                    className: `flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 ${workerRequestsTab === "incidents" ? "bg-slate-900 text-white shadow-sm" : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`,
                    children: [
                      "Incidencias",
                      !viewedTabs.includes("worker-incidents") && justifiableIncidentRecords.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                        "span",
                        {
                          className: `rounded-full px-2 py-0.5 text-xs transition-opacity duration-300 ${workerRequestsTab === "incidents" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`,
                          children: justifiableIncidentRecords.length
                        }
                      ) : null
                    ]
                  }
                )
              ] }) }),
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "border-b border-slate-100 bg-slate-50/70 px-5 py-3", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
                /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500", children: "Mes activo" }),
                  /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("p", { className: "text-sm text-slate-700", children: [
                    "Las solicitudes e incidencias se cargan para",
                    " ",
                    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "font-medium text-slate-900", children: formatMonthLabel(selectedMonth) }),
                    "."
                  ] })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex items-center gap-1 self-start", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                    Button,
                    {
                      variant: "secondary",
                      onClick: () => setSelectedMonth(
                        (current) => shiftMonthValue(current, -1)
                      ),
                      children: "<"
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "min-w-[132px] text-center text-sm font-medium text-slate-700", children: formatMonthLabel(selectedMonth) }),
                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                    Button,
                    {
                      variant: "secondary",
                      onClick: () => setSelectedMonth(
                        (current) => shiftMonthValue(current, 1)
                      ),
                      children: ">"
                    }
                  )
                ] })
              ] }) }),
              workerRequestsTab === "incidents" ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
                "div",
                {
                  className: "rounded-xl border border-slate-200 bg-white p-5 shadow-sm",
                  style: tabPanelAnimationStyle,
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "mb-4 space-y-1", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("h3", { className: "text-base font-semibold text-slate-900", children: "Mis incidencias justificables" }),
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm text-slate-600", children: "Aqu\xED puedes ver las incidencias que admiten justificaci\xF3n y enviarla para revisi\xF3n." })
                    ] }),
                    loading || incidentJustificationsLoading ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm text-slate-500", children: "Cargando incidencias justificables..." }) : justifiableIncidentRecords.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm text-slate-500", children: "No tienes incidencias pendientes de justificar." }) : /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "space-y-4", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-3", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                          Input,
                          {
                            label: "Desde",
                            type: "date",
                            value: requestsDateFrom,
                            onChange: (e) => setRequestsDateFrom(e.target.value)
                          }
                        ),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                          Input,
                          {
                            label: "Hasta",
                            type: "date",
                            value: requestsDateTo,
                            onChange: (e) => setRequestsDateTo(e.target.value)
                          }
                        ),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "flex items-end", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                          Button,
                          {
                            variant: "secondary",
                            className: "bg-white border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl px-4 py-2 shadow-sm transition-all",
                            onClick: clearRequestFilters,
                            children: "Limpiar"
                          }
                        ) })
                      ] }),
                      loading || incidentJustificationsLoading ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm text-slate-500 text-center py-8", children: "Cargando incidencias justificables..." }) : filteredWorkerIncidents.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm text-slate-500 text-center py-8", children: "No hay incidencias que coincidan con los filtros." }) : /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "space-y-3", children: filteredWorkerIncidents.map((record) => {
                        const justification = incidentJustificationsByRecordId.get(
                          record.id
                        );
                        return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
                          "div",
                          {
                            className: "rounded-xl border border-slate-200 bg-slate-50 p-4",
                            children: [
                              /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
                                /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "space-y-2", children: [
                                  /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex flex-wrap items-center gap-2 text-sm", children: [
                                    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "font-medium text-slate-900", children: formatShortDate(record.workDate) }),
                                    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "text-slate-400", children: "\u2022" }),
                                    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "text-slate-700", children: getRecordLine(record) }),
                                    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                      "span",
                                      {
                                        className: `inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${CALENDAR_STATUS_BADGE_CLASSES[getDisplayRecordStatus(record)]}`,
                                        children: STATUS_LABELS[getDisplayRecordStatus(record)]
                                      }
                                    ),
                                    justification ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                      "span",
                                      {
                                        className: `inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${INCIDENT_JUSTIFICATION_STATUS_CLASSES[justification.status]}`,
                                        children: INCIDENT_JUSTIFICATION_STATUS_LABELS[justification.status]
                                      }
                                    ) : null
                                  ] }),
                                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm text-slate-700", children: getStatusDetail(record) })
                                ] }),
                                justification && hasAdminResponseForIncidentJustification(
                                  justification
                                ) ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                  "button",
                                  {
                                    type: "button",
                                    className: "inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-base font-semibold leading-none text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600",
                                    onClick: () => setIncidentJustificationToDelete(
                                      justification
                                    ),
                                    "aria-label": "Eliminar justificaci\xF3n aprobada",
                                    title: "Eliminar justificaci\xF3n aprobada",
                                    children: "\xD7"
                                  }
                                ) : justification ? null : /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                  Button,
                                  {
                                    disabled: incidentJustificationSubmitting,
                                    onClick: () => {
                                      setSelectedIncidentRecordId(
                                        record.id
                                      );
                                      setIncidentJustificationReason("");
                                    },
                                    children: "Justificar"
                                  }
                                )
                              ] }),
                              justification ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "mt-3 grid gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 md:grid-cols-2", children: [
                                /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("p", { children: [
                                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "font-medium text-slate-900", children: "Motivo:" }),
                                  " ",
                                  justification.reason
                                ] }),
                                /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("p", { children: [
                                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "font-medium text-slate-900", children: "Respuesta:" }),
                                  " ",
                                  justification.adminComment ?? justification.coordinatorComment ?? "-"
                                ] })
                              ] }) : null
                            ]
                          },
                          `incident-justification-${record.id}`
                        );
                      }) })
                    ] })
                  ]
                }
              ) : null,
              workerRequestsTab === "requests" ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
                "div",
                {
                  className: "rounded-xl border border-slate-200 bg-white p-5 shadow-sm",
                  style: tabPanelAnimationStyle,
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "mb-4 space-y-1", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("h3", { className: "text-base font-semibold text-slate-900", children: "Mis solicitudes de fichaje" }),
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm text-slate-600", children: "Aqu\xED puedes consultar el estado de las regularizaciones que hayas pedido." })
                    ] }),
                    requests.length === 0 && !requestsLoading ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm text-slate-500", children: "Todav\xEDa no has enviado ninguna solicitud." }) : /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "space-y-4", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-4", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                          Input,
                          {
                            label: "Desde",
                            type: "date",
                            value: requestsDateFrom,
                            onChange: (e) => setRequestsDateFrom(e.target.value)
                          }
                        ),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                          Input,
                          {
                            label: "Hasta",
                            type: "date",
                            value: requestsDateTo,
                            onChange: (e) => setRequestsDateTo(e.target.value)
                          }
                        ),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                          Select,
                          {
                            id: "requestsStatusFilter",
                            label: "Estado",
                            value: requestsStatusFilter,
                            onChange: (e) => setRequestsStatusFilter(e.target.value),
                            options: [
                              { value: "", label: "Todos" },
                              {
                                value: "PENDING_COORDINATOR",
                                label: "Pendiente Administraci\xF3n (legado)"
                              },
                              {
                                value: "PENDING_ADMIN",
                                label: "Pendiente Administraci\xF3n"
                              },
                              { value: "APPROVED", label: "Aprobada" },
                              { value: "REJECTED", label: "Rechazada" }
                            ]
                          }
                        ),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "flex items-end", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                          Button,
                          {
                            variant: "secondary",
                            className: "bg-white border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl px-4 py-2 shadow-sm transition-all",
                            onClick: clearRequestFilters,
                            children: "Limpiar"
                          }
                        ) })
                      ] }),
                      requestsLoading ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm text-slate-500 text-center py-8", children: "Cargando solicitudes..." }) : filteredWorkerRequests.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm text-slate-500 text-center py-8", children: "No hay solicitudes que coincidan con los filtros." }) : /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "space-y-4", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "grid gap-4 md:hidden", children: filteredWorkerRequests.map((request) => /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
                          "div",
                          {
                            className: "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all active:scale-[0.99]",
                            children: [
                              /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "mb-4 flex items-start justify-between gap-3", children: [
                                /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "space-y-1", children: [
                                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-widest", children: "Fecha" }),
                                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm font-bold text-slate-900", children: formatShortDate(request.requestDate) })
                                ] }),
                                /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex items-start gap-2", children: [
                                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                    "span",
                                    {
                                      className: `rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${ADJUSTMENT_STATUS_CLASSES[request.status]}`,
                                      children: ADJUSTMENT_STATUS_LABELS[request.status]
                                    }
                                  ),
                                  hasAdminResponseForAdjustmentRequest(
                                    request
                                  ) ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                    "button",
                                    {
                                      type: "button",
                                      className: "inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-base font-semibold leading-none text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600",
                                      onClick: () => setAdjustmentRequestToDelete(
                                        request
                                      ),
                                      "aria-label": "Eliminar solicitud respondida",
                                      title: "Eliminar solicitud respondida",
                                      children: "\xD7"
                                    }
                                  ) : null
                                ] })
                              ] }),
                              /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "grid grid-cols-2 gap-4 mb-4 rounded-xl bg-slate-50 p-3", children: [
                                /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { children: [
                                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-tight", children: "Tipo" }),
                                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-xs font-semibold text-slate-700", children: ADJUSTMENT_TYPE_LABELS[request.requestType] })
                                ] }),
                                /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { children: [
                                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-tight", children: "Hora" }),
                                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-xs font-semibold text-slate-700", children: formatTimeOnly(
                                    request.requestedTime
                                  ) })
                                ] })
                              ] }),
                              /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "space-y-3 pt-3 border-t border-slate-100", children: [
                                /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { children: [
                                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-1", children: "Motivo" }),
                                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm text-slate-600 leading-relaxed", children: request.reason })
                                ] }),
                                (request.status === "REJECTED" || request.adminComment || request.coordinatorComment) && /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "rounded-xl border border-rose-100 bg-rose-50/50 p-3", children: [
                                  request.status === "REJECTED" && /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "mb-2", children: [
                                    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-[10px] font-bold text-rose-400 uppercase tracking-tight mb-1", children: "Rechazada por" }),
                                    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-xs font-semibold text-rose-700", children: request.reviewedByAdminId ? "Administraci\xF3n" : request.reviewedByCoordinatorId ? "Coordinaci\xF3n" : "-" })
                                  ] }),
                                  (request.adminComment || request.coordinatorComment) && /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { children: [
                                    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-[10px] font-bold text-rose-400 uppercase tracking-tight mb-1", children: "Nota de revisi\xF3n" }),
                                    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("p", { className: "text-xs text-rose-600 leading-relaxed italic", children: [
                                      '"',
                                      request.adminComment ?? request.coordinatorComment,
                                      '"'
                                    ] })
                                  ] })
                                ] })
                              ] })
                            ]
                          },
                          request.id
                        )) }),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "hidden md:block overflow-x-auto rounded-xl border border-slate-200", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("table", { className: "min-w-full divide-y divide-slate-200 text-sm", children: [
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("tr", { className: "bg-slate-50 text-left text-slate-500", children: [
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("th", { className: "py-3 pr-4 pl-4 font-semibold uppercase tracking-wider text-[10px]", children: "Fecha" }),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("th", { className: "py-3 pr-4 font-semibold uppercase tracking-wider text-[10px]", children: "Tipo" }),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("th", { className: "py-3 pr-4 font-semibold uppercase tracking-wider text-[10px]", children: "Hora" }),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("th", { className: "py-3 pr-4 font-semibold uppercase tracking-wider text-[10px]", children: "Estado" }),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("th", { className: "min-w-[200px] py-3 pr-4 font-semibold uppercase tracking-wider text-[10px]", children: "Motivo" }),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("th", { className: "min-w-[120px] py-3 pr-4 font-semibold uppercase tracking-wider text-[10px]", children: "Rechazada" }),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("th", { className: "py-3 pr-4 font-semibold uppercase tracking-wider text-[10px]", children: "Nota" }),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("th", { className: "py-3 pr-4 font-semibold uppercase tracking-wider text-[10px] text-right", children: "Acciones" })
                          ] }) }),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("tbody", { className: "divide-y divide-slate-100 bg-white", children: filteredWorkerRequests.map((request) => /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
                            "tr",
                            {
                              className: "hover:bg-slate-50 transition-colors",
                              children: [
                                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("td", { className: "py-4 pr-4 pl-4 align-top font-medium text-slate-900", children: formatShortDate(request.requestDate) }),
                                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("td", { className: "py-4 pr-4 align-top", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                  "span",
                                  {
                                    className: `inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${ADJUSTMENT_TYPE_CLASSES[request.requestType]}`,
                                    children: ADJUSTMENT_TYPE_LABELS[request.requestType]
                                  }
                                ) }),
                                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("td", { className: "py-4 pr-4 align-top text-slate-600 tabular-nums", children: formatTimeOnly(
                                  request.requestedTime
                                ) }),
                                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("td", { className: "py-4 pr-4 align-top", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                  "span",
                                  {
                                    className: `inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${ADJUSTMENT_STATUS_CLASSES[request.status]}`,
                                    children: ADJUSTMENT_STATUS_LABELS[request.status]
                                  }
                                ) }),
                                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("td", { className: "py-4 pr-4 align-top text-slate-600 max-w-[250px]", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "whitespace-normal leading-relaxed", children: request.reason }) }),
                                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("td", { className: "py-4 pr-4 align-top", children: request.status !== "REJECTED" ? "-" : /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                  "span",
                                  {
                                    className: `inline-flex rounded-full border bg-transparent px-2 py-0.5 text-[10px] font-bold uppercase ${request.reviewedByAdminId ? "border-rose-500 text-rose-700" : "border-orange-500 text-orange-700"}`,
                                    children: request.reviewedByAdminId ? "Admin" : "Coordinador"
                                  }
                                ) }),
                                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("td", { className: "py-4 pr-4 align-top text-slate-500 italic max-w-[200px]", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "whitespace-normal leading-relaxed", children: request.adminComment ?? request.coordinatorComment ?? "-" }) }),
                                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("td", { className: "py-4 pr-4 align-top text-right", children: hasAdminResponseForAdjustmentRequest(
                                  request
                                ) ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                  "button",
                                  {
                                    type: "button",
                                    className: "inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-base font-semibold leading-none text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600",
                                    onClick: () => setAdjustmentRequestToDelete(
                                      request
                                    ),
                                    "aria-label": "Eliminar solicitud respondida",
                                    title: "Eliminar solicitud respondida",
                                    children: "\xD7"
                                  }
                                ) : /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "text-slate-300", children: "-" }) })
                              ]
                            },
                            request.id
                          )) })
                        ] }) })
                      ] })
                    ] })
                  ]
                }
              ) : null
            ] }) : null
          ] }) : null,
          isManagerMode && canAccessManagementPanel ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_jsx_runtime9.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm", children: [
              showCoordinatorModeBanner ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex items-center gap-2.5 px-1 py-0.5 text-xs text-slate-500", children: [
                /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { className: "inline-flex shrink-0 items-center gap-1.5 rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-medium text-cyan-700 ring-1 ring-inset ring-cyan-700/10", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "h-1.5 w-1.5 rounded-full bg-cyan-500" }),
                  "Vista de Coordinaci\xF3n"
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { children: "Aqu\xED solo ver\xE1s incidencias horarias de los trabajadores de tu \xE1mbito." })
              ] }) : null,
              /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: `grid gap-4 ${managerOverviewColsClass}`, children: [
                canReviewAdjustmentRequests ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
                  "button",
                  {
                    type: "button",
                    onClick: () => {
                      handleTabClick("requests");
                      scrollToSection(pendingRequestsSectionRef);
                    },
                    className: "group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:border-indigo-300 hover:shadow-md active:scale-[0.98]",
                    children: [
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "absolute -top-3 -right-1 h-[4.8rem] w-[4.2rem] rounded-full bg-indigo-50/65 transition-transform duration-500 group-hover:scale-[1.8]" }),
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "relative flex h-full flex-col", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex items-center justify-between", children: [
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                            "svg",
                            {
                              xmlns: "http://www.w3.org/2000/svg",
                              fill: "none",
                              viewBox: "0 0 24 24",
                              strokeWidth: 2,
                              stroke: "currentColor",
                              className: "h-5 w-5",
                              children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                "path",
                                {
                                  strokeLinecap: "round",
                                  strokeLinejoin: "round",
                                  d: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                                }
                              )
                            }
                          ) }),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "text-3xl font-black tracking-tight text-slate-900", children: managerPendingCount })
                        ] }),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "mt-5", children: [
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("h3", { className: "text-base font-bold text-slate-900", children: "Solicitudes pendientes" }),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "mt-1 text-xs text-slate-500", children: managerPendingCount === 0 ? "Todo al d\xEDa." : "Requieren tu aprobaci\xF3n inmediata." })
                        ] }),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "mt-auto pt-6", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { className: "inline-flex items-center text-[11px] font-bold uppercase tracking-wider text-indigo-600", children: [
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "border-b border-indigo-100 group-hover:border-indigo-500 transition-colors", children: "Abrir solicitudes" }),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "ml-1 transition-transform group-hover:translate-x-1", children: "\u2192" })
                        ] }) })
                      ] })
                    ]
                  }
                ) : null,
                canReviewExclusionRequests ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
                  "button",
                  {
                    type: "button",
                    onClick: () => {
                      handleTabClick("exclusions");
                      scrollToSection(pendingRequestsSectionRef);
                    },
                    className: "group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:border-sky-300 hover:shadow-md active:scale-[0.98]",
                    children: [
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "absolute -top-3 -right-1 h-[4.8rem] w-[4.2rem] rounded-full bg-indigo-50/65 transition-transform duration-500 group-hover:scale-[1.8]" }),
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "relative flex h-full flex-col", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex items-center justify-between", children: [
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 transition-colors group-hover:bg-sky-100", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                            "svg",
                            {
                              xmlns: "http://www.w3.org/2000/svg",
                              fill: "none",
                              viewBox: "0 0 24 24",
                              strokeWidth: 2,
                              stroke: "currentColor",
                              className: "h-5 w-5",
                              children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                "path",
                                {
                                  strokeLinecap: "round",
                                  strokeLinejoin: "round",
                                  d: "M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                                }
                              )
                            }
                          ) }),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "text-3xl font-black tracking-tight text-slate-900", children: pendingExclusionCount })
                        ] }),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "mt-5", children: [
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("h3", { className: "text-base font-bold text-slate-900", children: "Teletrabajo y permisos" }),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "mt-1 text-xs text-slate-500", children: "Gesti\xF3n de ausencias y trabajo remoto." })
                        ] }),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "mt-auto pt-6", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { className: "inline-flex items-center text-[11px] font-bold uppercase tracking-wider text-sky-600", children: [
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "border-b border-sky-100 group-hover:border-sky-500 transition-colors", children: "Revisar permisos" }),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "ml-1 transition-transform group-hover:translate-x-1", children: "\u2192" })
                        ] }) })
                      ] })
                    ]
                  }
                ) : null,
                /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
                  "button",
                  {
                    type: "button",
                    onClick: () => setShowManagerIncidentsModal(true),
                    className: "group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:border-orange-300 hover:shadow-md active:scale-[0.98]",
                    children: [
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "absolute -top-3 -right-1 h-[4.8rem] w-[4.2rem] rounded-full bg-orange-50/65 transition-transform duration-500 group-hover:scale-[1.8]" }),
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "relative flex h-full flex-col", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex items-center justify-between", children: [
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 transition-colors group-hover:bg-orange-100", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                            "svg",
                            {
                              xmlns: "http://www.w3.org/2000/svg",
                              fill: "none",
                              viewBox: "0 0 24 24",
                              strokeWidth: 2,
                              stroke: "currentColor",
                              className: "h-5 w-5",
                              children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                "path",
                                {
                                  strokeLinecap: "round",
                                  strokeLinejoin: "round",
                                  d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                }
                              )
                            }
                          ) }),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "text-3xl font-black tracking-tight text-slate-900", children: managerIncidentRecords.length })
                        ] }),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "mt-5", children: [
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("h3", { className: "text-base font-bold text-slate-900", children: isCoordinatorManagerView ? "Incidencias horarias del equipo" : "Fichajes con incidencia" }),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "mt-1 text-xs text-slate-500", children: isCoordinatorManagerView ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_jsx_runtime9.Fragment, { children: [
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "font-semibold text-orange-600", children: managerIncidentUsersCount }),
                            " ",
                            managerIncidentUsersCount === 1 ? "trabajador con desajustes de horas." : "trabajadores con desajustes de horas."
                          ] }) : /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_jsx_runtime9.Fragment, { children: [
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "font-semibold text-orange-600", children: managerIncidentUsersCount }),
                            " ",
                            managerIncidentUsersCount === 1 ? "trabajador" : "trabajadores",
                            " ",
                            "con anomal\xEDas."
                          ] }) })
                        ] }),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "mt-auto pt-6", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { className: "inline-flex items-center text-[11px] font-bold uppercase tracking-wider text-orange-600", children: [
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "border-b border-orange-100 group-hover:border-orange-500 transition-colors", children: "Abrir incidencias" }),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "ml-1 transition-transform group-hover:translate-x-1", children: "\u2192" })
                        ] }) })
                      ] })
                    ]
                  }
                )
              ] }),
              canViewTeamRecords ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm", children: [
                /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "mb-4 flex flex-wrap items-center justify-between gap-3", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500", children: "Resumen diario" }),
                    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("h3", { className: "text-base font-semibold text-slate-900", children: "Seguimiento de asistencia" }),
                    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm text-slate-600", children: "Consulta qui\xE9n ha fichado y qui\xE9n falta en la fecha seleccionada." })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex items-center gap-1 rounded-lg bg-white p-1 shadow-sm border border-slate-200", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                      "button",
                      {
                        type: "button",
                        onClick: () => adjustTrackerDate(-1),
                        className: "flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-colors",
                        children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                          "svg",
                          {
                            className: "h-4 w-4",
                            fill: "none",
                            viewBox: "0 0 24 24",
                            stroke: "currentColor",
                            strokeWidth: 2.5,
                            children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                              "path",
                              {
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                                d: "M15 19l-7-7 7-7"
                              }
                            )
                          }
                        )
                      }
                    ),
                    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex items-center gap-2 px-2 border-x border-slate-100", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("label", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block", children: "Fecha" }),
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                        "input",
                        {
                          type: "date",
                          value: trackerDate,
                          onChange: (e) => setTrackerDate(e.target.value),
                          className: "border-none bg-transparent text-sm font-semibold text-slate-900 focus:outline-none focus:ring-0 cursor-pointer"
                        }
                      )
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                      "button",
                      {
                        type: "button",
                        onClick: () => adjustTrackerDate(1),
                        className: "flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-colors",
                        children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                          "svg",
                          {
                            className: "h-4 w-4",
                            fill: "none",
                            viewBox: "0 0 24 24",
                            stroke: "currentColor",
                            strokeWidth: 2.5,
                            children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                              "path",
                              {
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                                d: "M9 5l7 7-7 7"
                              }
                            )
                          }
                        )
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "grid gap-4 md:grid-cols-2 xl:grid-cols-3", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
                    "div",
                    {
                      onClick: () => setManagerDailyListType("checked-in"),
                      className: "group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-300 hover:shadow-md active:scale-[0.98]",
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "absolute -top-3 -right-1 h-[4.8rem] w-[4.2rem] rounded-full bg-indigo-50/65 transition-transform duration-500 group-hover:scale-[1.8]" }),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "relative flex h-full flex-col", children: [
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex items-center justify-between", children: [
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                              "svg",
                              {
                                xmlns: "http://www.w3.org/2000/svg",
                                fill: "none",
                                viewBox: "0 0 24 24",
                                strokeWidth: 2.5,
                                stroke: "currentColor",
                                className: "h-5 w-5",
                                children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                  "path",
                                  {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    d: "M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z"
                                  }
                                )
                              }
                            ) }),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "text-3xl font-black tracking-tight text-slate-900", children: checkedInTodayUsers.length })
                          ] }),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "mt-5", children: [
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("h3", { className: "text-base font-bold text-slate-900", children: "Fichados hoy" }),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "mt-2 h-1.5 w-full rounded-full bg-slate-100", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                              "div",
                              {
                                className: "h-full rounded-full bg-emerald-500 transition-all duration-700",
                                style: {
                                  width: `${Math.min(100, checkedInTodayUsers.length / (totalExpectedTodayUsers.length || 1) * 100)}%`
                                }
                              }
                            ) }),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("p", { className: "mt-2 text-xs text-slate-500 italic", children: [
                              checkedInTodayUsers.length,
                              " de",
                              " ",
                              totalExpectedTodayUsers.length,
                              " esperados"
                            ] })
                          ] }),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "mt-auto pt-6", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { className: "inline-flex items-center text-[11px] font-bold uppercase tracking-wider text-emerald-600", children: [
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "border-b border-emerald-100 group-hover:border-emerald-500 transition-colors", children: "Ver lista de entrada" }),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "ml-1 transition-transform group-hover:translate-x-1", children: "\u2192" })
                          ] }) })
                        ] })
                      ]
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
                    "div",
                    {
                      onClick: () => setManagerDailyListType("missing"),
                      className: "group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-rose-300 hover:shadow-md active:scale-[0.98]",
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "absolute -top-3 -right-1 h-[4.8rem] w-[4.2rem] rounded-full bg-indigo-50/65 transition-transform duration-500 group-hover:scale-[1.8]" }),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "relative flex h-full flex-col", children: [
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex items-center justify-between", children: [
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition-colors group-hover:bg-rose-100", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                              "svg",
                              {
                                xmlns: "http://www.w3.org/2000/svg",
                                fill: "none",
                                viewBox: "0 0 24 24",
                                strokeWidth: 2.5,
                                stroke: "currentColor",
                                className: "h-5 w-5",
                                children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                  "path",
                                  {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    d: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                                  }
                                )
                              }
                            ) }),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "text-3xl font-black tracking-tight text-slate-900", children: notCheckedInTodayUsers.length })
                          ] }),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "mt-5", children: [
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("h3", { className: "text-base font-bold text-slate-900", children: "Sin fichar" }),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "mt-2 h-1.5 w-full rounded-full bg-slate-100", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                              "div",
                              {
                                className: "h-full rounded-full bg-rose-500 transition-all duration-700",
                                style: {
                                  width: `${Math.min(100, notCheckedInTodayUsers.length / (totalExpectedTodayUsers.length || 1) * 100)}%`
                                }
                              }
                            ) }),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "mt-2 text-xs text-slate-500", children: "Pendientes de iniciar jornada." })
                          ] }),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "mt-auto pt-6", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { className: "inline-flex items-center text-[11px] font-bold uppercase tracking-wider text-rose-600", children: [
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "border-b border-rose-100 group-hover:border-rose-500 transition-colors", children: "Revisar ausencias" }),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "ml-1 transition-transform group-hover:translate-x-1", children: "\u2192" })
                          ] }) })
                        ] })
                      ]
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
                    "div",
                    {
                      onClick: () => setManagerDailyListType("exclusions"),
                      className: "group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-400 hover:shadow-md active:scale-[0.98]",
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "absolute -top-3 -right-1 h-[4.8rem] w-[4.2rem] rounded-full bg-indigo-50/65 transition-transform duration-500 group-hover:scale-[1.8]" }),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "relative flex h-full flex-col", children: [
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex items-center justify-between", children: [
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors group-hover:bg-slate-200", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                              "svg",
                              {
                                xmlns: "http://www.w3.org/2000/svg",
                                fill: "none",
                                viewBox: "0 0 24 24",
                                strokeWidth: 2.5,
                                stroke: "currentColor",
                                className: "h-5 w-5",
                                children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                  "path",
                                  {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    d: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                                  }
                                )
                              }
                            ) }),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "text-3xl font-black tracking-tight text-slate-900", children: totalExpectedTodayUsers.length })
                          ] }),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "mt-5", children: [
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("h3", { className: "text-base font-bold text-slate-900", children: "Plantilla esperada" }),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "mt-2 text-xs leading-relaxed text-slate-500", children: exclusionSummaryText })
                          ] }),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "mt-auto pt-6", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { className: "inline-flex items-center text-[11px] font-bold uppercase tracking-wider text-slate-600", children: [
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "border-b border-slate-100 group-hover:border-slate-500 transition-colors", children: "Abrir detalle diario" }),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "ml-1 transition-transform group-hover:translate-x-1", children: "\u2192" })
                          ] }) })
                        ] })
                      ]
                    }
                  )
                ] })
              ] }) : null
            ] }),
            canViewTeamRecords ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
              "div",
              {
                className: "mb-12 overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md",
                id: "cuadrante-diario",
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "border-b border-slate-100 p-5 lg:p-6", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "space-y-1", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex items-center gap-2", children: [
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "h-4 w-1 rounded-full bg-indigo-600" }),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400", children: "Visualizador Temporal" })
                        ] }),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("h3", { className: "text-lg font-black text-slate-900 tracking-tight lg:text-xl", children: "Cuadrante de fichajes" }),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "max-w-2xl text-sm text-slate-500", children: "Distribuci\xF3n horaria de la actividad del equipo por slots de 60 minutos." })
                      ] }),
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 shadow-sm", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                          "button",
                          {
                            type: "button",
                            onClick: () => adjustTrackerDate(-1),
                            className: "flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 transition-all hover:text-indigo-600 active:scale-90",
                            children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                              "svg",
                              {
                                className: "h-5 w-5",
                                fill: "none",
                                viewBox: "0 0 24 24",
                                stroke: "currentColor",
                                strokeWidth: 2.5,
                                children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                  "path",
                                  {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    d: "M15 19l-7-7 7-7"
                                  }
                                )
                              }
                            )
                          }
                        ),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "px-4", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                          "input",
                          {
                            type: "date",
                            value: trackerDate,
                            onChange: (e) => setTrackerDate(e.target.value),
                            className: "bg-transparent text-sm font-black uppercase tracking-tight text-slate-700 outline-none cursor-pointer"
                          }
                        ) }),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                          "button",
                          {
                            type: "button",
                            onClick: () => adjustTrackerDate(1),
                            className: "flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 transition-all hover:text-indigo-600 active:scale-90",
                            children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                              "svg",
                              {
                                className: "h-5 w-5",
                                fill: "none",
                                viewBox: "0 0 24 24",
                                stroke: "currentColor",
                                strokeWidth: 2.5,
                                children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                  "path",
                                  {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    d: "M9 5l7 7-7 7"
                                  }
                                )
                              }
                            )
                          }
                        )
                      ] })
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "mt-4 flex flex-wrap items-center gap-4 border-t border-slate-50 pt-4", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "text-[11px] font-semibold text-slate-500", children: "Estado" }),
                      RECORD_STATE_LEGEND_ITEMS.map(renderLegendChip),
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "h-3.5 w-px bg-slate-200" }),
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "text-[11px] font-semibold text-slate-500", children: "Validaci\xF3n" }),
                      RECORD_VALIDATION_LEGEND_ITEMS.map(renderLegendChip)
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-2 xl:grid-cols-[minmax(0,280px)_160px_160px_120px] xl:justify-start", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "xl:max-w-[280px]", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                          Input,
                          {
                            id: "trackerUserFilter",
                            label: "Trabajador",
                            type: "search",
                            list: "trackerUserFilterSuggestions",
                            value: trackerUserSearch,
                            placeholder: "Todos",
                            onChange: (event) => {
                              const nextValue = event.target.value;
                              setTrackerUserSearch(nextValue);
                              const exactMatch = teamMembers.find(
                                (member) => member.name === nextValue
                              );
                              setTrackerUserFilter(exactMatch?.id ?? "");
                            }
                          }
                        ),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("datalist", { id: "trackerUserFilterSuggestions", children: teamMembers.map((member) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("option", { value: member.name }, `tracker-user-${member.id}`)) })
                      ] }),
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                        Select,
                        {
                          id: "trackerStatusFilter",
                          label: "Estado",
                          value: trackerStatusFilter,
                          onChange: (event) => setTrackerStatusFilter(
                            event.target.value
                          ),
                          options: [
                            { value: "", label: "Todos" },
                            { value: "COMPLETED", label: "Completado" },
                            { value: "OPEN", label: "Abierta" },
                            { value: "ABSENT", label: "Ausente" }
                          ]
                        }
                      ),
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                        Select,
                        {
                          id: "trackerTrustFilter",
                          label: "Validaci\xF3n",
                          value: trackerTrustFilter,
                          onChange: (event) => setTrackerTrustFilter(
                            event.target.value
                          ),
                          options: [
                            { value: "", label: "Todas" },
                            { value: "CORRECT", label: "Correcta" },
                            { value: "REVIEW", label: "Revisar" }
                          ]
                        }
                      ),
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "flex items-end", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                        Button,
                        {
                          variant: "secondary",
                          className: "bg-white border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl px-4 py-2 shadow-sm transition-all",
                          onClick: clearTrackerFilters,
                          children: "Limpiar"
                        }
                      ) })
                    ] })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "relative bg-white p-4", children: managerTrackerMembers.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "flex h-32 items-center justify-center rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50/40", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm text-slate-500", children: "No hay trabajadores que coincidan con los filtros del cuadrante." }) }) : /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "overflow-x-auto rounded-[1.5rem] border border-slate-100", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("table", { className: "w-full border-collapse text-xs", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("tr", { className: "bg-slate-50/50", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("th", { className: "sticky left-0 z-30 min-w-[240px] border-b border-r border-slate-100 bg-slate-50 px-6 py-4 text-left font-black uppercase tracking-widest text-slate-400", children: "Trabajador" }),
                      Array.from({ length: 15 }, (_, i) => i + 6).map(
                        (h) => /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
                          "th",
                          {
                            className: "min-w-[64px] border-b border-slate-100 px-2 py-4 text-center font-bold text-slate-400",
                            children: [
                              String(h).padStart(2, "0"),
                              ":00"
                            ]
                          },
                          `h-${h}`
                        )
                      )
                    ] }) }),
                    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("tbody", { children: managerTrackerMembers.map((member) => {
                      const userRecords = trackerDateRecordsMap.get(member.id) || [];
                      return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
                        "tr",
                        {
                          className: "group hover:bg-slate-50/30",
                          children: [
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("td", { className: "sticky left-0 z-20 min-w-[240px] border-b border-r border-slate-100 bg-white px-6 py-4 font-bold text-slate-700 group-hover:bg-slate-50/80 transition-colors", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex items-center gap-2", children: [
                              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "h-1.5 w-1.5 rounded-full bg-slate-300 group-hover:bg-indigo-400 transition-colors" }),
                              member.name
                            ] }) }),
                            Array.from(
                              { length: 15 },
                              (_, i) => i + 6
                            ).map((h) => {
                              const matchingRecord = getHourlySlotRecord(
                                userRecords,
                                h
                              );
                              let bgColor = "bg-slate-50/50";
                              let opacity = "opacity-100";
                              if (matchingRecord) {
                                bgColor = getQuadrantRecordColorClasses(
                                  matchingRecord
                                );
                              } else {
                                opacity = "opacity-20";
                              }
                              return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                "td",
                                {
                                  className: "border-b border-slate-100 p-1.5",
                                  children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                    "div",
                                    {
                                      onClick: () => matchingRecord && setSelectedRecordForDetail(
                                        matchingRecord
                                      ),
                                      title: matchingRecord ? `Ver detalle de ${member.name}` : "",
                                      className: `h-9 w-full rounded-lg transition-all duration-300 ${bgColor} ${opacity} ${matchingRecord ? "shadow-lg scale-[1.02] ring-1 ring-white/20 cursor-pointer hover:brightness-110 active:scale-95" : "hover:bg-slate-200"}`
                                    }
                                  )
                                },
                                `cell-${member.id}-${h}`
                              );
                            })
                          ]
                        },
                        `q-row-${member.id}`
                      );
                    }) })
                  ] }) }) })
                ]
              }
            ) : null,
            /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
              "div",
              {
                ref: pendingRequestsSectionRef,
                className: "flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm",
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "border-b border-slate-100 bg-white p-1.5", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: `grid gap-1 ${managerMenuColsClass}`, children: [
                    canReviewAdjustmentRequests ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
                      "button",
                      {
                        type: "button",
                        onClick: () => handleTabClick("requests"),
                        className: `flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 ${managerReviewTab === "requests" ? "bg-slate-900 text-white shadow-sm" : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`,
                        children: [
                          "Fichajes",
                          !viewedTabs.includes("requests") && pendingRequests.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                            "span",
                            {
                              className: `rounded-full px-2 py-0.5 text-xs transition-opacity duration-300 ${managerReviewTab === "requests" ? "bg-white/20 text-white" : "bg-rose-100 text-rose-600"}`,
                              children: pendingRequests.length
                            }
                          )
                        ]
                      }
                    ) : null,
                    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
                      "button",
                      {
                        type: "button",
                        onClick: () => handleTabClick("incidents"),
                        className: `flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 ${managerReviewTab === "incidents" ? "bg-slate-900 text-white shadow-sm" : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`,
                        children: [
                          isCoordinatorManagerView ? "Incidencias horarias" : "Incidencias",
                          !viewedTabs.includes("incidents") && pendingIncidentJustifications.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                            "span",
                            {
                              className: `rounded-full px-2 py-0.5 text-xs transition-opacity duration-300 ${managerReviewTab === "incidents" ? "bg-white/20 text-white" : "bg-rose-100 text-rose-600"}`,
                              children: pendingIncidentJustifications.length
                            }
                          )
                        ]
                      }
                    ),
                    canViewTeamRecords ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                      "button",
                      {
                        type: "button",
                        onClick: () => handleTabClick("records"),
                        className: `flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 ${managerReviewTab === "records" ? "bg-slate-900 text-white shadow-sm" : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`,
                        children: "Registros"
                      }
                    ) : null,
                    canReviewExclusionRequests ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
                      "button",
                      {
                        type: "button",
                        onClick: () => handleTabClick("exclusions"),
                        className: `flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 ${managerReviewTab === "exclusions" ? "bg-slate-900 text-white shadow-sm" : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`,
                        children: [
                          "Permisos",
                          !viewedTabs.includes("exclusions") && pendingExclusionCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                            "span",
                            {
                              className: `rounded-full px-2 py-0.5 text-xs transition-opacity duration-300 ${managerReviewTab === "exclusions" ? "bg-white/20 text-white" : "bg-rose-100 text-rose-600"}`,
                              children: pendingExclusionCount
                            }
                          )
                        ]
                      }
                    ) : null
                  ] }) }),
                  canViewTeamRecords && managerReviewTab === "records" ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
                    "div",
                    {
                      className: "border-b border-slate-100 bg-slate-50/50 p-5",
                      style: tabPanelAnimationStyle,
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "mb-4 space-y-1", children: [
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500", children: "Filtros" }),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("h3", { className: "text-base font-semibold text-slate-900", children: "Filtros de registros" })
                        ] }),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "grid gap-4 md:grid-cols-2 xl:grid-cols-7 items-start", children: [
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                            Input,
                            {
                              label: "Desde",
                              type: "date",
                              value: managerDateFrom,
                              onChange: (event) => setManagerDateFrom(event.target.value)
                            }
                          ),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                            Input,
                            {
                              label: "Hasta",
                              type: "date",
                              value: managerDateTo,
                              onChange: (event) => setManagerDateTo(event.target.value)
                            }
                          ),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                            Input,
                            {
                              label: "Hora desde",
                              type: "time",
                              value: managerHourFrom,
                              onChange: (event) => setManagerHourFrom(event.target.value)
                            }
                          ),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                            Input,
                            {
                              label: "Hora hasta",
                              type: "time",
                              value: managerHourTo,
                              onChange: (event) => setManagerHourTo(event.target.value)
                            }
                          ),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "block", children: [
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                              Input,
                              {
                                id: "managerUserFilter",
                                label: "Trabajador",
                                type: "search",
                                list: "managerUserFilterSuggestions",
                                value: managerUserSearch,
                                placeholder: "Busca por nombre o selecciona uno...",
                                autoComplete: "off",
                                onChange: (event) => {
                                  const nextValue = event.target.value;
                                  const normalizedValue = nextValue.trim().toLocaleLowerCase("es-ES");
                                  const exactMatch = teamMembers.find(
                                    (member) => member.name.toLocaleLowerCase("es-ES") === normalizedValue
                                  );
                                  setManagerUserSearch(nextValue);
                                  setManagerUserFilter(exactMatch?.id ?? "");
                                }
                              }
                            ),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("datalist", { id: "managerUserFilterSuggestions", children: teamMembers.map((member) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("option", { value: member.name }, member.id)) }),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "mt-1 text-xs text-slate-500", children: "Escribe parte del nombre para filtrar." })
                          ] }),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                            Select,
                            {
                              id: "managerTrustFilter",
                              label: "Validaci\xF3n",
                              value: managerTrustFilter,
                              onChange: (event) => setManagerTrustFilter(
                                event.target.value
                              ),
                              options: [
                                { value: "", label: "Todas" },
                                { value: "CORRECT", label: "Correcta" },
                                { value: "REVIEW", label: "Revisar" }
                              ]
                            }
                          ),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex flex-col", children: [
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "text-sm font-medium text-transparent select-none pb-1.5", children: "Spacer" }),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                              Button,
                              {
                                variant: "secondary",
                                className: "w-full bg-white border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl px-4 py-2 shadow-sm transition-all h-[38px] flex items-center justify-center",
                                onClick: () => {
                                  setManagerDateFrom("");
                                  setManagerDateTo("");
                                  setManagerHourFrom("");
                                  setManagerHourTo("");
                                  setManagerUserSearch("");
                                  setManagerUserFilter("");
                                  setManagerTrustFilter("");
                                },
                                children: "Limpiar"
                              }
                            )
                          ] })
                        ] })
                      ]
                    }
                  ) : null,
                  canReviewAdjustmentRequests && managerReviewTab === "requests" ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "bg-white p-6", style: tabPanelAnimationStyle, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "mb-4 space-y-1", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500", children: "Revisi\xF3n" }),
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("h3", { className: "text-base font-semibold text-slate-900", children: "Solicitudes pendientes" }),
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm text-slate-600", children: "Los usuarios autorizados pueden revisar y resolver estas solicitudes." })
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "space-y-6", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-5", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                          Input,
                          {
                            label: "Desde",
                            type: "date",
                            value: requestsDateFrom,
                            onChange: (e) => setRequestsDateFrom(e.target.value)
                          }
                        ),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                          Input,
                          {
                            label: "Hasta",
                            type: "date",
                            value: requestsDateTo,
                            onChange: (e) => setRequestsDateTo(e.target.value)
                          }
                        ),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                          Select,
                          {
                            id: "requestsStatusFilterManager",
                            label: "Estado",
                            value: requestsStatusFilter,
                            onChange: (e) => setRequestsStatusFilter(e.target.value),
                            options: [
                              { value: "", label: "Todos" },
                              {
                                value: "PENDING_COORDINATOR",
                                label: "Pendiente Coordinador"
                              },
                              {
                                value: "PENDING_ADMIN",
                                label: "Pendiente Admin"
                              }
                            ]
                          }
                        ),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                          Input,
                          {
                            id: "requestsUserFilterManager",
                            label: "Trabajador",
                            type: "search",
                            list: "requestsUserFilterSuggestions",
                            value: requestsUserSearch,
                            placeholder: "Todos",
                            onChange: (event) => {
                              const nextValue = event.target.value;
                              setRequestsUserSearch(nextValue);
                              const exactMatch = teamMembers.find(
                                (member) => member.name === nextValue
                              );
                              setRequestsUserFilter(exactMatch?.id ?? "");
                            }
                          }
                        ),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("datalist", { id: "requestsUserFilterSuggestions", children: teamMembers.map((member) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("option", { value: member.name }, `requests-user-${member.id}`)) }),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "flex items-end", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                          Button,
                          {
                            variant: "secondary",
                            className: "bg-white border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl px-4 py-2 shadow-sm transition-all",
                            onClick: clearRequestFilters,
                            children: "Limpiar"
                          }
                        ) })
                      ] }),
                      pendingRequestsLoading ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm text-slate-500 text-center py-8", children: "Cargando solicitudes pendientes..." }) : filteredManagerRequests.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm text-slate-500 text-center py-8", children: "No hay solicitudes pendientes que coincidan con los filtros." }) : /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "overflow-x-auto", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("table", { className: "min-w-full table-fixed divide-y divide-slate-200 text-sm", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("tr", { className: "sticky top-0 z-10 bg-slate-50 text-left text-[11px] uppercase tracking-[0.14em] text-slate-500 shadow-[0_1px_0_0_rgba(226,232,240,1)]", children: [
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("th", { className: "w-[20%] py-3 pr-4 pl-4 font-semibold", children: "Usuario" }),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("th", { className: "w-[11%] py-3 pr-4 font-semibold", children: "Tipo" }),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("th", { className: "w-[12%] py-3 pr-4 font-semibold", children: "Fecha y hora" }),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("th", { className: "w-[18%] py-3 pr-4 font-semibold", children: "Motivo" }),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("th", { className: "w-[14%] py-3 pr-4 font-semibold", children: "Estado" }),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("th", { className: "w-[17%] py-3 pr-4 font-semibold", children: "Comentario" }),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("th", { className: "w-[8%] py-3 pr-4 font-semibold", children: "Acciones" })
                        ] }) }),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("tbody", { className: "divide-y divide-slate-100", children: filteredManagerRequests.map((request) => /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
                          "tr",
                          {
                            className: "transition-colors hover:bg-slate-50/60",
                            children: [
                              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("td", { className: "py-4 pr-4 pl-4 align-middle text-slate-700", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "flex items-center gap-3", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "font-semibold text-slate-900", children: getDisplayUserName(
                                request.userId,
                                request.userName
                              ) }) }) }),
                              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("td", { className: "py-4 pr-4 align-middle text-slate-700", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                "span",
                                {
                                  className: `inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${ADJUSTMENT_TYPE_CLASSES[request.requestType]}`,
                                  children: ADJUSTMENT_TYPE_LABELS[request.requestType]
                                }
                              ) }),
                              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("td", { className: "py-4 pr-4 align-middle font-medium leading-6 text-slate-600", children: formatDateTime(request.requestedTime) }),
                              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("td", { className: "py-4 pr-4 align-middle text-slate-700", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "max-w-[280px] whitespace-normal leading-6", children: request.reason }) }),
                              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("td", { className: "py-4 pr-4 align-middle", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                "span",
                                {
                                  className: `inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${ADJUSTMENT_STATUS_CLASSES[request.status]}`,
                                  children: ADJUSTMENT_STATUS_LABELS[request.status]
                                }
                              ) }),
                              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("td", { className: "py-4 pr-4 align-middle", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                "textarea",
                                {
                                  className: "h-[72px] w-full min-w-[220px] resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-50",
                                  placeholder: "A\xF1ade un comentario...",
                                  value: reviewComments[request.id] ?? "",
                                  onChange: (event) => setReviewComments((current) => ({
                                    ...current,
                                    [request.id]: event.target.value
                                  }))
                                }
                              ) }),
                              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("td", { className: "py-4 pr-4 align-middle text-right", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "flex justify-end gap-2", children: (request.status === "PENDING_COORDINATOR" || request.status === "PENDING_ADMIN") && /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_jsx_runtime9.Fragment, { children: [
                                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                  Button,
                                  {
                                    variant: "secondary",
                                    className: "rounded-full border-rose-200 bg-white px-3.5 py-1.5 text-[12px] font-semibold text-rose-700 shadow-none hover:bg-rose-50",
                                    onClick: () => reviewRequest(
                                      request.id,
                                      "REJECTED"
                                    ),
                                    disabled: reviewSubmittingId === request.id || !isFunctionalAdmin,
                                    children: "Rechazar"
                                  }
                                ),
                                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                  Button,
                                  {
                                    className: "rounded-full bg-emerald-600 px-3.5 py-1.5 text-[12px] font-semibold text-white hover:bg-emerald-700",
                                    onClick: () => reviewRequest(
                                      request.id,
                                      "APPROVED"
                                    ),
                                    disabled: reviewSubmittingId === request.id || !isFunctionalAdmin,
                                    children: "Aprobar"
                                  }
                                )
                              ] }) }) })
                            ]
                          },
                          request.id
                        )) })
                      ] }) }) })
                    ] })
                  ] }) : null,
                  managerReviewTab === "incidents" ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "bg-white p-6", style: tabPanelAnimationStyle, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "mb-6 space-y-1", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500", children: "Revisi\xF3n" }),
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("h3", { className: "text-base font-semibold text-slate-900", children: isCoordinatorManagerView ? "Incidencias horarias del equipo" : "Control de incidencias y anomal\xEDas" }),
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm text-slate-600", children: isCoordinatorManagerView ? "Revisa excesos o faltas de horas de los trabajadores de tu \xE1mbito." : "Gestiona tanto las justificaciones enviadas por el equipo como los fichajes con errores detectados autom\xE1ticamente." })
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "space-y-8", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-4", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                          Select,
                          {
                            id: "incidentsStatusFilterManager",
                            label: "Estado Justificaci\xF3n",
                            value: incidentStatusFilter,
                            onChange: (e) => setIncidentStatusFilter(e.target.value),
                            options: [
                              { value: "", label: "Todos los estados" },
                              {
                                value: "PENDING_ADMIN",
                                label: "Pendiente Administraci\xF3n"
                              },
                              { value: "APPROVED", label: "Aprobada" },
                              { value: "REJECTED", label: "Rechazada" }
                            ]
                          }
                        ),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                          Input,
                          {
                            id: "incidentsUserFilterManager",
                            label: "Trabajador",
                            type: "search",
                            list: "incidentUserFilterSuggestions",
                            value: incidentUserSearch,
                            placeholder: "Todos los trabajadores",
                            onChange: (event) => {
                              const nextValue = event.target.value;
                              setIncidentUserSearch(nextValue);
                              const exactMatch = teamMembers.find(
                                (member) => member.name === nextValue
                              );
                              setIncidentUserFilter(exactMatch?.id ?? "");
                            }
                          }
                        ),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("datalist", { id: "incidentUserFilterSuggestions", children: teamMembers.map((member) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("option", { value: member.name }, `incident-user-${member.id}`)) }),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "flex items-end", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                          Button,
                          {
                            variant: "secondary",
                            className: "bg-white border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl px-4 py-2 shadow-sm transition-all",
                            onClick: clearIncidentFilters,
                            children: "Limpiar Filtros"
                          }
                        ) })
                      ] }),
                      !isCoordinatorManagerView ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "space-y-4", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex items-center gap-3", children: [
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "h-1.5 w-1.5 rounded-full bg-rose-500" }),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("h4", { className: "text-sm font-bold uppercase tracking-wider text-slate-700", children: [
                            "Justificaciones por revisar (",
                            filteredManagerIncidents.length,
                            ")"
                          ] })
                        ] }),
                        pendingIncidentJustificationsLoading ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex h-32 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50", children: [
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" }),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "mt-2 text-xs text-slate-500", children: "Cargando solicitudes..." })
                        ] }) : filteredManagerIncidents.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "flex h-32 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm text-slate-500", children: "No hay justificaciones con los filtros actuales." }) }) : /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "overflow-x-auto", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("table", { className: "w-full text-left text-sm", children: [
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("thead", { className: "bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("tr", { children: [
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("th", { className: "px-4 py-3", children: "Trabajador" }),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("th", { className: "px-4 py-3", children: "Registro" }),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("th", { className: "px-4 py-3", children: "Motivo" }),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("th", { className: "px-4 py-3", children: "Estado" }),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("th", { className: "px-4 py-3", children: "Acciones" })
                          ] }) }),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("tbody", { className: "divide-y divide-slate-100", children: filteredManagerIncidents.map(
                            (justification) => /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
                              "tr",
                              {
                                className: "hover:bg-slate-50/50 transition-colors",
                                children: [
                                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("td", { className: "px-4 py-4", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "font-semibold text-slate-900", children: getDisplayUserName(
                                    justification.userId,
                                    justification.userName
                                  ) }) }),
                                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("td", { className: "px-4 py-4", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "space-y-1", children: [
                                    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "font-medium text-slate-900", children: justification.workDate ? formatShortDate(
                                      justification.workDate
                                    ) : "Sin fecha" }),
                                    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-xs text-slate-600", children: getRecordLine({
                                      checkInAt: justification.checkInAt ?? "",
                                      checkOutAt: justification.checkOutAt ?? null
                                    }) })
                                  ] }) }),
                                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("td", { className: "px-4 py-4", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "max-w-[250px] whitespace-normal leading-5 text-slate-700", children: justification.reason }) }),
                                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("td", { className: "px-4 py-4", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                    "span",
                                    {
                                      className: `inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${INCIDENT_JUSTIFICATION_STATUS_CLASSES[justification.status]}`,
                                      children: INCIDENT_JUSTIFICATION_STATUS_LABELS[justification.status]
                                    }
                                  ) }),
                                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("td", { className: "px-4 py-4", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "flex items-center gap-2", children: justification.status === "PENDING_COORDINATOR" || justification.status === "PENDING_ADMIN" ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_jsx_runtime9.Fragment, { children: [
                                    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                      "button",
                                      {
                                        onClick: () => reviewIncidentJustification(
                                          justification.id,
                                          "REJECTED"
                                        ),
                                        disabled: reviewSubmittingId === justification.id || !canReviewIncidentRequests,
                                        className: "rounded-full border border-rose-200 bg-white px-3.5 py-1.5 text-[12px] font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50",
                                        children: "Rechazar"
                                      }
                                    ),
                                    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                      "button",
                                      {
                                        onClick: () => reviewIncidentJustification(
                                          justification.id,
                                          "APPROVED"
                                        ),
                                        disabled: reviewSubmittingId === justification.id || !canReviewIncidentRequests,
                                        className: "rounded-full bg-emerald-600 px-3.5 py-1.5 text-[12px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50",
                                        children: "Aprobar"
                                      }
                                    )
                                  ] }) : null }) })
                                ]
                              },
                              justification.id
                            )
                          ) })
                        ] }) }) })
                      ] }) : null,
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "space-y-4", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex items-center gap-3", children: [
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "h-1.5 w-1.5 rounded-full bg-orange-500" }),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("h4", { className: "text-sm font-bold uppercase tracking-wider text-slate-700", children: [
                            isCoordinatorManagerView ? "Registros horarios con incidencia (" : "Fichajes con incidencia (",
                            filteredManagerIncidentRecords.length,
                            ")"
                          ] })
                        ] }),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-6", children: [
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                            Input,
                            {
                              id: "incidentRecordUserFilter",
                              label: "Trabajador",
                              type: "search",
                              list: "incidentRecordUserFilterSuggestions",
                              value: incidentRecordUserSearch,
                              placeholder: "Todos",
                              onChange: (event) => {
                                const nextValue = event.target.value;
                                setIncidentRecordUserSearch(nextValue);
                                const exactMatch = teamMembers.find(
                                  (member) => member.name === nextValue
                                );
                                setIncidentRecordUserFilter(exactMatch?.id ?? "");
                              }
                            }
                          ),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("datalist", { id: "incidentRecordUserFilterSuggestions", children: teamMembers.map((member) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("option", { value: member.name }, `incident-record-user-${member.id}`)) }),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                            Input,
                            {
                              label: "Desde",
                              type: "date",
                              value: incidentRecordDateFrom,
                              onChange: (event) => setIncidentRecordDateFrom(event.target.value)
                            }
                          ),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                            Input,
                            {
                              label: "Hasta",
                              type: "date",
                              value: incidentRecordDateTo,
                              onChange: (event) => setIncidentRecordDateTo(event.target.value)
                            }
                          ),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                            Select,
                            {
                              id: "incidentRecordTrustFilter",
                              label: "Validaci\xF3n",
                              value: incidentRecordTrustFilter,
                              onChange: (event) => setIncidentRecordTrustFilter(
                                event.target.value
                              ),
                              options: [
                                { value: "", label: "Todas" },
                                { value: "CORRECT", label: "Correcta" },
                                { value: "REVIEW", label: "Revisar" }
                              ]
                            }
                          ),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                            Select,
                            {
                              id: "incidentRecordStatusFilter",
                              label: "Estado",
                              value: incidentRecordStatusFilter,
                              onChange: (e) => setIncidentRecordStatusFilter(
                                e.target.value
                              ),
                              options: [
                                { value: "", label: "Todos" },
                                { value: "INCIDENT", label: "Ausente (anomal\xEDa)" },
                                { value: "INCOMPLETE", label: "Ausente (sin salida)" }
                              ]
                            }
                          ),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "flex items-end", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                            Button,
                            {
                              variant: "secondary",
                              className: "bg-white border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl px-4 py-2 shadow-sm transition-all",
                              onClick: clearIncidentRecordFilters,
                              children: "Limpiar"
                            }
                          ) })
                        ] }),
                        filteredManagerIncidentRecords.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "flex h-32 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm text-slate-500", children: "No hay fichajes con incidencia que coincidan con los filtros." }) }) : /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm", children: [
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "hidden grid-cols-[minmax(0,1.5fr)_110px_120px_120px_minmax(0,2fr)_120px] gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 md:grid", children: [
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { children: "Trabajador" }),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { children: "Fecha" }),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { children: "Estado" }),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { children: "Validaci\xF3n" }),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { children: "Detalle" }),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "text-right", children: "Acceso" })
                          ] }),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "divide-y divide-slate-100", children: filteredManagerIncidentRecords.map((record) => /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
                            "button",
                            {
                              type: "button",
                              onClick: () => openManagerRecordDetail(record),
                              className: "group grid w-full gap-2 px-4 py-3 text-left transition hover:bg-orange-50/40 md:grid-cols-[minmax(0,1.5fr)_110px_120px_120px_minmax(0,2fr)_120px] md:items-center md:gap-3",
                              children: [
                                /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "min-w-0", children: [
                                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "truncate text-sm font-semibold text-slate-900", children: getDisplayUserName(
                                    record.userId,
                                    record.userName
                                  ) }),
                                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "mt-0.5 text-xs text-slate-500 md:hidden", children: formatShortDate(record.workDate) })
                                ] }),
                                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "hidden text-sm text-slate-600 md:block", children: formatShortDate(record.workDate) }),
                                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                  "span",
                                  {
                                    className: `inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_CLASSES[getDisplayRecordStatus(record)]}`,
                                    children: STATUS_LABELS[getDisplayRecordStatus(record)]
                                  }
                                ) }),
                                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                  "span",
                                  {
                                    className: `inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${TRUST_LEVEL_CLASSES[getDisplayTrustLevel(record)]}`,
                                    children: getDisplayTrustLabel(record)
                                  }
                                ) }),
                                /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "min-w-0", children: [
                                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm text-slate-700 md:hidden", children: getRecordLine(record) }),
                                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "truncate text-sm text-slate-700", children: getStatusDetail(record) })
                                ] }),
                                /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex items-center justify-between md:justify-end", children: [
                                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "text-[11px] font-bold uppercase tracking-wider text-orange-600 transition-colors group-hover:text-orange-700", children: "Abrir detalle" }),
                                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "text-sm text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-orange-400 md:ml-2", children: "\u2192" })
                                ] })
                              ]
                            },
                            `anomaly-tab-${record.id}`
                          )) })
                        ] })
                      ] })
                    ] })
                  ] }) : null,
                  canReviewExclusionRequests && managerReviewTab === "exclusions" ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "bg-white p-6", style: tabPanelAnimationStyle, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "mb-4 space-y-1", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500", children: "Revisi\xF3n" }),
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("h3", { className: "text-base font-semibold text-slate-900", children: "Solicitudes de teletrabajo y permisos" }),
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm text-slate-600", children: "Flujo por etapas: trabajador, coordinador y administraci\xF3n." })
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "space-y-6", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-5", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                          Input,
                          {
                            label: "Desde",
                            type: "date",
                            value: requestsDateFrom,
                            onChange: (e) => setRequestsDateFrom(e.target.value)
                          }
                        ),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                          Input,
                          {
                            label: "Hasta",
                            type: "date",
                            value: requestsDateTo,
                            onChange: (e) => setRequestsDateTo(e.target.value)
                          }
                        ),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                          Select,
                          {
                            id: "exclStatusFilterManager",
                            label: "Estado",
                            value: requestsStatusFilter,
                            onChange: (e) => setRequestsStatusFilter(e.target.value),
                            options: [
                              { value: "", label: "Todos" },
                              {
                                value: "PENDING_COORDINATOR",
                                label: "Pendiente Coordinador"
                              },
                              {
                                value: "PENDING_ADMIN",
                                label: "Pendiente Admin"
                              }
                            ]
                          }
                        ),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                          Input,
                          {
                            id: "exclUserFilterManager",
                            label: "Trabajador",
                            type: "search",
                            list: "requestsUserFilterSuggestions",
                            value: requestsUserSearch,
                            placeholder: "Todos",
                            onChange: (event) => {
                              const nextValue = event.target.value;
                              setRequestsUserSearch(nextValue);
                              const exactMatch = teamMembers.find(
                                (member) => member.name === nextValue
                              );
                              setRequestsUserFilter(exactMatch?.id ?? "");
                            }
                          }
                        ),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "flex items-end", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                          Button,
                          {
                            variant: "secondary",
                            className: "bg-white border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl px-4 py-2 shadow-sm transition-all",
                            onClick: clearRequestFilters,
                            children: "Limpiar"
                          }
                        ) })
                      ] }),
                      pendingExclusionRequestsLoading ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm text-slate-500 text-center py-8", children: "Cargando solicitudes..." }) : filteredManagerExclusions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm text-slate-500 text-center py-8", children: "No hay solicitudes que coincidan con los filtros." }) : /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "overflow-x-auto", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("table", { className: "min-w-full divide-y divide-slate-200 text-sm", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("tr", { className: "sticky top-0 z-10 bg-slate-50 text-left text-slate-500 shadow-[0_1px_0_0_rgba(226,232,240,1)]", children: [
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("th", { className: "py-2.5 pr-4 pl-3 font-semibold", children: "Usuario" }),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("th", { className: "py-2.5 pr-4 font-semibold", children: "Tipo" }),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("th", { className: "py-2.5 pr-4 font-semibold", children: "Fecha" }),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("th", { className: "py-2.5 pr-4 font-semibold", children: "Estado" }),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("th", { className: "py-2.5 pr-4 font-semibold", children: "Motivo" }),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("th", { className: "py-2.5 pr-4 font-semibold", children: "Comentario" }),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("th", { className: "py-2.5 pr-4 font-semibold", children: "Acciones" })
                        ] }) }),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("tbody", { className: "divide-y divide-slate-100", children: filteredManagerExclusions.map((request) => /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
                          "tr",
                          {
                            className: "align-top",
                            children: [
                              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("td", { className: "py-3 pr-4 text-slate-700", children: getDisplayUserName(
                                request.userId,
                                request.userName
                              ) }),
                              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("td", { className: "py-3 pr-4", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                "span",
                                {
                                  className: `inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${request.kind === "REMOTE_WORK" ? "border border-indigo-500 bg-transparent text-indigo-700" : "border border-cyan-500 bg-transparent text-cyan-700"}`,
                                  children: request.kind === "REMOTE_WORK" ? "Teletrabajo" : "Permiso"
                                }
                              ) }),
                              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("td", { className: "py-3 pr-4 text-slate-700", children: formatShortDate(request.requestDate) }),
                              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("td", { className: "py-3 pr-4", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                "span",
                                {
                                  className: `inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${EXCLUSION_REQUEST_STATUS_CLASSES[request.status]}`,
                                  children: EXCLUSION_REQUEST_STATUS_LABELS[request.status]
                                }
                              ) }),
                              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("td", { className: "py-3 pr-4 text-slate-700", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "max-w-[280px] whitespace-normal leading-6", children: request.reason }) }),
                              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("td", { className: "py-3 pr-4", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                "textarea",
                                {
                                  className: "h-[72px] w-full min-w-[220px] resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400",
                                  placeholder: "A\xF1ade un comentario...",
                                  value: reviewComments[request.id] ?? "",
                                  onChange: (event) => setReviewComments((current) => ({
                                    ...current,
                                    [request.id]: event.target.value
                                  }))
                                }
                              ) }),
                              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("td", { className: "py-3 pr-4 text-right", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex justify-end gap-2", children: [
                                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                  Button,
                                  {
                                    variant: "secondary",
                                    className: "rounded-full border-rose-200 bg-white px-3.5 py-1.5 text-[12px] font-semibold text-rose-700 shadow-none hover:bg-rose-50",
                                    onClick: () => reviewExclusionRequest(
                                      request,
                                      "REJECTED"
                                    ),
                                    disabled: reviewSubmittingId === request.id || request.status === "PENDING_ADMIN" && !isFunctionalAdmin,
                                    children: "Rechazar"
                                  }
                                ),
                                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                  Button,
                                  {
                                    className: `${request.status === "PENDING_ADMIN" ? "bg-emerald-600 hover:bg-emerald-700" : ""} rounded-full px-3.5 py-1.5 text-[12px] font-semibold text-white`,
                                    onClick: () => reviewExclusionRequest(
                                      request,
                                      "APPROVED"
                                    ),
                                    disabled: reviewSubmittingId === request.id || request.status === "PENDING_ADMIN" && !isFunctionalAdmin,
                                    children: "Aprobar"
                                  }
                                )
                              ] }) })
                            ]
                          },
                          `pending-exclusion-${request.kind}-${request.id}`
                        )) })
                      ] }) })
                    ] })
                  ] }) : null,
                  canViewTeamRecords && managerReviewTab === "records" ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
                    "div",
                    {
                      ref: recordsSectionRef,
                      className: "bg-white p-6",
                      style: tabPanelAnimationStyle,
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3", children: [
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "text-[11px] font-medium text-slate-400", children: "Estado" }),
                          RECORD_STATE_LEGEND_ITEMS.map(renderLegendChip)
                        ] }),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4", children: [
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex flex-wrap items-center gap-4", children: [
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "text-[11px] font-medium text-slate-400", children: "Validaci\xF3n" }),
                            RECORD_VALIDATION_LEGEND_ITEMS.map(renderLegendChip)
                          ] }),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "mt-3 text-xs leading-relaxed text-slate-600", children: "La validaci\xF3n resume si el fichaje es correcto, si conviene revisarlo o si presenta una anomal\xEDa t\xE9cnica o de ubicaci\xF3n." })
                        ] }),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "mb-6 flex flex-wrap items-end justify-between gap-4", children: [
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "space-y-1", children: [
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500", children: "Equipo" }),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("h3", { className: "text-base font-semibold text-slate-900", children: "Registros del equipo" }),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm text-slate-600", children: "Consulta todos los fichajes registrados en el conjunto filtrado actual." })
                          ] }),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "flex gap-2", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
                            Button,
                            {
                              variant: "secondary",
                              className: "flex items-center gap-2",
                              onClick: exportToExcel,
                              disabled: managerVisibleRecords.length === 0 || !managerUserFilter,
                              children: [
                                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                  "svg",
                                  {
                                    className: "h-4 w-4",
                                    fill: "none",
                                    viewBox: "0 0 24 24",
                                    stroke: "currentColor",
                                    strokeWidth: 2,
                                    children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                      "path",
                                      {
                                        strokeLinecap: "round",
                                        strokeLinejoin: "round",
                                        d: "M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                      }
                                    )
                                  }
                                ),
                                "Descargar Excel"
                              ]
                            }
                          ) })
                        ] }),
                        !managerUserFilter ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "mb-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3", children: [
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                            "svg",
                            {
                              className: "h-4 w-4 shrink-0 text-amber-500",
                              fill: "none",
                              viewBox: "0 0 24 24",
                              stroke: "currentColor",
                              strokeWidth: 2,
                              children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                "path",
                                {
                                  strokeLinecap: "round",
                                  strokeLinejoin: "round",
                                  d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                }
                              )
                            }
                          ),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-xs font-medium text-amber-700", children: "Selecciona un trabajador en el filtro para exportar su informe." })
                        ] }) : null,
                        loading ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm text-slate-500", children: "Cargando registros del equipo..." }) : managerVisibleRecords.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm text-slate-500", children: "No hay registros que coincidan con los filtros aplicados." }) : /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "max-h-[600px] overflow-auto rounded-xl border border-slate-200", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("table", { className: "min-w-full divide-y divide-slate-200 text-sm", children: [
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("tr", { className: "sticky top-0 z-10 bg-slate-50 text-left text-slate-500 shadow-[0_1px_0_0_rgba(226,232,240,1)]", children: [
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("th", { className: "py-2.5 pr-4 pl-5 font-semibold", children: "Trabajador" }),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("th", { className: "py-2.5 pr-4 font-semibold", children: "Fecha" }),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("th", { className: "py-2.5 pr-4 font-semibold", children: "Entrada" }),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("th", { className: "py-2.5 pr-4 font-semibold", children: "Salida" }),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("th", { className: "py-2.5 pr-4 font-semibold", children: "Horas" }),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("th", { className: "py-2.5 pr-4 font-semibold", children: "Estado" }),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("th", { className: "py-2.5 pr-4 font-semibold", children: "Validaci\xF3n" }),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("th", { className: "py-2.5 pr-4 font-semibold", children: "Detalle" })
                          ] }) }),
                          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("tbody", { className: "divide-y divide-slate-100", children: managerVisibleRecords.map((record) => /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("tr", { children: [
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("td", { className: "py-3 pr-4 pl-5 text-slate-700", children: getDisplayUserName(
                              record.userId,
                              record.userName
                            ) }),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("td", { className: "py-3 pr-4 text-slate-700", children: formatShortDate(record.workDate) }),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("td", { className: "py-3 pr-4 text-slate-700", children: formatTimeOnly(record.checkInAt) }),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("td", { className: "py-3 pr-4 text-slate-700", children: formatTimeOnly(record.checkOutAt) }),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("td", { className: "py-3 pr-4 text-slate-700", children: formatHoursFromMinutes(record.workedMinutes) }),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("td", { className: "py-3 pr-4", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                              "span",
                              {
                                className: `inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CLASSES[getDisplayRecordStatus(record)]}`,
                                children: STATUS_LABELS[getDisplayRecordStatus(record)]
                              }
                            ) }),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                              "td",
                              {
                                className: "py-3 pr-4",
                                title: getTrustTooltip(record),
                                children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                                  "span",
                                  {
                                    className: `inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${TRUST_LEVEL_CLASSES[getDisplayTrustLevel(record)]}`,
                                    children: getDisplayTrustLabel(record)
                                  }
                                )
                              }
                            ),
                            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("td", { className: "py-3 pr-4 text-slate-700", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "space-y-2", children: [
                              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { children: getStatusDetail(record) }),
                              /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
                                "button",
                                {
                                  type: "button",
                                  className: "group inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition-all hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600",
                                  onClick: () => setSelectedRecordForDetail(record),
                                  children: [
                                    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { children: isPendingAdminValidation(record) ? "Abrir y validar" : "Abrir detalle" }),
                                    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "transition-transform group-hover:translate-x-0.5", children: "\u2192" })
                                  ]
                                }
                              )
                            ] }) })
                          ] }, `manager-record-${record.id}`)) })
                        ] }) })
                      ]
                    }
                  ) : null
                ]
              }
            )
          ] }) : null
        ] })
      }
    ),
    actionPopup ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 px-4", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex flex-col items-center text-center", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 text-sky-700", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
        "svg",
        {
          className: "h-7 w-7 animate-spin",
          viewBox: "0 0 24 24",
          fill: "none",
          xmlns: "http://www.w3.org/2000/svg",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
              "circle",
              {
                className: "opacity-25",
                cx: "12",
                cy: "12",
                r: "10",
                stroke: "currentColor",
                strokeWidth: "4"
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
              "path",
              {
                className: "opacity-75",
                fill: "currentColor",
                d: "M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              }
            )
          ]
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("h3", { className: "text-base font-semibold text-slate-900", children: "Procesando acci\xF3n" }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "mt-2 text-sm text-slate-600", children: actionPopup.message })
    ] }) }) }) : null,
    toast ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 px-4", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex flex-col items-center text-center", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
        "div",
        {
          className: `relative mb-4 h-14 w-14 shrink-0 rounded-full ${toast.tone === "success" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`,
          children: toast.tone === "success" ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
            "svg",
            {
              xmlns: "http://www.w3.org/2000/svg",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: 2,
              className: "absolute inset-0 m-auto block h-6 w-6",
              children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                "path",
                {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  d: "M5 13l4 4L19 7"
                }
              )
            }
          ) : /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
            "svg",
            {
              xmlns: "http://www.w3.org/2000/svg",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: 2,
              className: "absolute inset-0 m-auto block h-6 w-6",
              children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                "path",
                {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  d: "M12 9v4m0 4h.01M10.29 3.86l-7.5 13A1 1 0 003.67 18h16.66a1 1 0 00.88-1.14l-7.5-13a1 1 0 00-1.74 0z"
                }
              )
            }
          )
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("h3", { className: "text-base font-semibold text-slate-900", children: toast.tone === "success" ? "Operaci\xF3n completada" : "Se produjo un error" }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "mt-2 text-sm text-slate-600", children: toast.message }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "mt-5", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
        Button,
        {
          variant: "secondary",
          className: POPUP_NEUTRAL_BUTTON_CLASS,
          onClick: () => setToast(null),
          children: "Aceptar"
        }
      ) })
    ] }) }) }) : null,
    selectedOverflowDate && selectedOverflowRecords.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "space-y-1", children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("h3", { className: "text-base font-semibold text-slate-900", children: [
            "Jornadas del",
            " ",
            formatDateTime(`${selectedOverflowDate} 00:00:00`).slice(
              0,
              10
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm text-slate-600", children: "Aqu\xED puedes ver todos los fichajes registrados en ese d\xEDa." })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
          Button,
          {
            variant: "secondary",
            className: POPUP_NEUTRAL_BUTTON_CLASS,
            onClick: () => setSelectedOverflowDate(null),
            children: "Cerrar"
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "mt-4 max-h-[70vh] space-y-3 overflow-y-auto pr-1", children: selectedOverflowRecords.map((record) => /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
        "div",
        {
          className: "rounded-xl border border-slate-200 bg-slate-50 p-4",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex flex-wrap items-center gap-2 text-sm", children: [
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "font-medium text-slate-900", children: getRecordLine(record) }),
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                "span",
                {
                  className: `inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${CALENDAR_STATUS_BADGE_CLASSES[getDisplayRecordStatus(record)]}`,
                  children: STATUS_LABELS[getDisplayRecordStatus(record)]
                }
              )
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2", children: [
              /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("p", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "font-medium text-slate-900", children: "Entrada:" }),
                " ",
                formatDateTime(record.checkInAt)
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("p", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "font-medium text-slate-900", children: "Salida:" }),
                " ",
                formatDateTime(record.checkOutAt)
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("p", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "font-medium text-slate-900", children: "Horas:" }),
                " ",
                formatHoursFromMinutes(record.workedMinutes)
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("p", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "font-medium text-slate-900", children: "Detalle:" }),
                " ",
                getStatusDetail(record)
              ] })
            ] })
          ]
        },
        `overflow-${record.id}`
      )) })
    ] }) }) : null,
    managerDailyListType ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "space-y-0.5", children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm font-semibold text-slate-900", children: managerDailyListType === "checked-in" ? "Fichados en fecha seleccionada" : managerDailyListType === "missing" ? "No fichados en fecha seleccionada" : "Excluidos (Vacaciones/Permisos)" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-xs font-medium text-slate-400", children: formatShortDate(trackerDate) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
          Button,
          {
            variant: "secondary",
            className: POPUP_NEUTRAL_BUTTON_CLASS,
            onClick: () => setManagerDailyListType(null),
            children: "Cerrar"
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "max-h-[60vh] overflow-y-auto px-5 py-4", children: managerDailyListUsers.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm text-slate-500 text-center py-4", children: "No hay usuarios en esta lista para la fecha seleccionada." }) : /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("ul", { className: "space-y-2", children: managerDailyListUsers.map((user) => /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
        "li",
        {
          className: "flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm transition-all hover:border-slate-200 hover:bg-slate-50/50",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-600 font-bold text-xs border border-slate-100 uppercase", children: user.name ? user.name.charAt(0) : "?" }),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "text-sm font-medium text-slate-800", children: user.name })
          ]
        },
        `manager-daily-${managerDailyListType}-${user.id}`
      )) }) })
    ] }) }) : null,
    showRemoteWorkModal ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3", children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "space-y-1", children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm font-medium text-slate-800", children: "Teletrabajo autorizado en fecha seleccionada" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("p", { className: "text-xs text-slate-500", children: [
            remoteWorkTodayUsers.length,
            " autorizado",
            remoteWorkTodayUsers.length === 1 ? "" : "s",
            " para fichar desde internet"
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
          Button,
          {
            variant: "secondary",
            className: POPUP_NEUTRAL_BUTTON_CLASS,
            onClick: () => setShowRemoteWorkModal(false),
            children: "Cerrar"
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "max-h-[60vh] overflow-y-auto px-4 py-4", children: remoteWorkTodayUsers.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm text-slate-500", children: "No hay usuarios autorizados en teletrabajo para la fecha seleccionada." }) : /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("ul", { className: "space-y-2", children: remoteWorkTodayUsers.map((user) => {
        const hasCheckedIn = checkedInTrackerUserIds.has(user.id);
        return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
          "li",
          {
            className: "rounded-xl border border-slate-200 bg-slate-50 px-4 py-3",
            children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm text-slate-700", children: user.name }),
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                "span",
                {
                  className: `inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${hasCheckedIn ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`,
                  children: hasCheckedIn ? "Ha fichado" : "Pendiente de fichar"
                }
              )
            ] })
          },
          `remote-work-${user.id}`
        );
      }) }) })
    ] }) }) : null,
    showManagerIncidentsModal ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-5 py-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-[10px] font-bold uppercase tracking-widest text-slate-400", children: "Rango actual" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "mt-0.5 text-base font-semibold text-slate-900 tracking-tight", children: "Registros con anomal\xEDas" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "mt-2 flex flex-wrap gap-2", children: [
            managerIncidentRecords.filter((r) => r.status === "INCIDENT").length > 0 && /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { className: "inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700", children: [
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "h-1.5 w-1.5 rounded-full bg-rose-500" }),
              managerIncidentRecords.filter((r) => r.status === "INCIDENT").length,
              " incidencia",
              managerIncidentRecords.filter((r) => r.status === "INCIDENT").length !== 1 ? "s" : ""
            ] }),
            managerIncidentRecords.filter((r) => r.status === "INCOMPLETE").length > 0 && /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { className: "inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600", children: [
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "h-1.5 w-1.5 rounded-full bg-slate-400" }),
              managerIncidentRecords.filter((r) => r.status === "INCOMPLETE").length,
              " incompleta",
              managerIncidentRecords.filter((r) => r.status === "INCOMPLETE").length !== 1 ? "s" : ""
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
          Button,
          {
            variant: "secondary",
            className: `${POPUP_NEUTRAL_BUTTON_CLASS} shrink-0`,
            onClick: () => setShowManagerIncidentsModal(false),
            children: "Cerrar"
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "max-h-[60vh] overflow-y-auto px-5 py-4", children: managerIncidentRecords.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm text-slate-500 text-center py-4", children: "No hay incidencias en el conjunto filtrado actualmente." }) : /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "space-y-2", children: managerIncidentRecords.map((record) => /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
        "div",
        {
          className: `rounded-xl border px-4 py-3 shadow-sm transition-all ${record.status === "INCOMPLETE" ? "border-slate-200 bg-white hover:border-slate-300" : "border-rose-100 bg-white hover:border-rose-200"}`,
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex flex-wrap items-center gap-2", children: [
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "text-sm font-semibold text-slate-900", children: getDisplayUserName(record.userId, record.userName) }),
              /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
                "span",
                {
                  className: `inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${record.status === "INCOMPLETE" ? "border-slate-200 text-slate-600 bg-slate-50/50" : "border-rose-200 text-rose-700 bg-rose-50/50"}`,
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: `h-1.5 w-1.5 rounded-full ${record.status === "INCOMPLETE" ? "bg-slate-400" : "bg-rose-500"}` }),
                    STATUS_LABELS[getDisplayRecordStatus(record)]
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "mt-1.5 text-sm text-slate-500", children: getRecordLine(record) }),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "mt-0.5 text-sm font-medium text-slate-600", children: getStatusDetail(record) })
          ]
        },
        `manager-incident-${record.id}`
      )) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex items-center gap-2.5 border-t border-slate-100 px-5 py-3.5 bg-slate-50/30 rounded-b-2xl", children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
          "svg",
          {
            className: "h-4 w-4 shrink-0 text-slate-400",
            fill: "none",
            viewBox: "0 0 24 24",
            stroke: "currentColor",
            strokeWidth: 2,
            children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("p", { className: "text-xs text-slate-400 leading-normal", children: [
          "Las justificaciones enviadas por los trabajadores aparecer\xE1n en",
          " ",
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "font-semibold text-slate-500", children: "Incidencias" }),
          " para su revisi\xF3n."
        ] })
      ] })
    ] }) }) : null,
    selectedDetailDate && selectedDetailRecords.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("p", { className: "text-sm font-semibold text-slate-900 tracking-tight", children: [
          "Detalle de",
          " ",
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "text-indigo-600 font-bold", children: selectedDetailUserId ? getDisplayUserName(
            selectedDetailUserId,
            selectedDetailRecords[0]?.userName
          ) : "" }),
          " ",
          "el ",
          formatDateTime(`${selectedDetailDate} 00:00:00`).slice(0, 10)
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
          Button,
          {
            variant: "secondary",
            className: `${POPUP_NEUTRAL_BUTTON_CLASS} shrink-0`,
            onClick: () => {
              setSelectedDetailDate(null);
              setSelectedDetailUserId(null);
            },
            children: "Cerrar"
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "max-h-[65vh] space-y-4 overflow-y-auto px-5 py-4", children: [
        selectedDetailRecords.map((record) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "p-0.5", children: renderRecordDetailContent(record) }, `detail-${record.id}`)),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3.5 flex items-center justify-between shadow-inner", children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "space-y-0.5", children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-xs font-medium text-slate-400 uppercase tracking-wider", children: "Total trabajado del d\xEDa" }),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-xl font-bold text-slate-900 tracking-tight", children: formatHoursFromMinutes(selectedDetailWorkedMinutes) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
            "svg",
            {
              xmlns: "http://www.w3.org/2000/svg",
              fill: "none",
              viewBox: "0 0 24 24",
              strokeWidth: 1.5,
              stroke: "currentColor",
              className: "w-5 h-5 text-slate-400",
              children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" })
            }
          )
        ] })
      ] })
    ] }) }) : null,
    isWorkerMode && selectedIncidentRecordId ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "space-y-1", children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("h3", { className: "text-base font-semibold text-slate-900", children: "Justificar incidencia" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm text-slate-600", children: "Explica el motivo para que coordinaci\xF3n y administraci\xF3n puedan revisarlo." })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
          Button,
          {
            variant: "secondary",
            className: POPUP_NEUTRAL_BUTTON_CLASS,
            onClick: () => {
              setSelectedIncidentRecordId(null);
              setIncidentJustificationReason("");
            },
            children: "Cerrar"
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "mt-4 space-y-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "space-y-2", children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
            "label",
            {
              className: "block text-sm font-medium text-slate-700",
              htmlFor: "incidentJustificationReason",
              children: "Motivo *"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
            "textarea",
            {
              id: "incidentJustificationReason",
              className: "min-h-[120px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400",
              required: true,
              value: incidentJustificationReason,
              onChange: (event) => setIncidentJustificationReason(event.target.value)
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-xs text-slate-500", children: "Describe qu\xE9 ocurri\xF3 y cualquier contexto \xFAtil para la revisi\xF3n." })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex justify-end gap-2", children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
            Button,
            {
              variant: "secondary",
              className: POPUP_NEUTRAL_BUTTON_CLASS,
              onClick: () => {
                setSelectedIncidentRecordId(null);
                setIncidentJustificationReason("");
              },
              children: "Cancelar"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
            Button,
            {
              className: POPUP_PRIMARY_BUTTON_CLASS,
              disabled: incidentJustificationSubmitting,
              onClick: submitIncidentJustification,
              children: incidentJustificationSubmitting ? "Enviando..." : "Enviar justificaci\xF3n"
            }
          )
        ] })
      ] })
    ] }) }) : null,
    isWorkerMode && incidentJustificationToDelete ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "space-y-1", children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("h3", { className: "text-base font-semibold text-slate-900", children: "Ocultar respuesta" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm text-slate-600", children: "Esta acci\xF3n quitar\xE1 de tu vista la respuesta administrativa de esta incidencia." })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "mt-4 space-y-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700", children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("p", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "font-medium text-slate-900", children: "Incidencia:" }),
            " ",
            incidentJustificationToDelete.workDate ? formatShortDate(incidentJustificationToDelete.workDate) : "Sin fecha",
            " ",
            "\xB7",
            " ",
            getRecordLine({
              checkInAt: incidentJustificationToDelete.checkInAt ?? "",
              checkOutAt: incidentJustificationToDelete.checkOutAt ?? null
            })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("p", { className: "mt-2", children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "font-medium text-slate-900", children: "Motivo:" }),
            " ",
            incidentJustificationToDelete.reason
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm text-slate-700", children: "\xBFSeguro que quieres ocultar esta respuesta?" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex justify-end gap-2", children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
            Button,
            {
              variant: "secondary",
              className: POPUP_NEUTRAL_BUTTON_CLASS,
              onClick: () => setIncidentJustificationToDelete(null),
              disabled: Boolean(deletingIncidentJustificationId),
              children: "Cancelar"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
            Button,
            {
              className: POPUP_DANGER_BUTTON_CLASS,
              onClick: deleteIncidentJustification,
              disabled: Boolean(deletingIncidentJustificationId),
              children: deletingIncidentJustificationId ? "Eliminando..." : "Eliminar"
            }
          )
        ] })
      ] })
    ] }) }) : null,
    isWorkerMode && adjustmentRequestToDelete ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "space-y-1", children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("h3", { className: "text-base font-semibold text-slate-900", children: "Ocultar solicitud respondida" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm text-slate-600", children: "Esta acci\xF3n quitar\xE1 de tu vista una solicitud ya respondida por administraci\xF3n." })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "mt-4 space-y-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700", children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("p", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "font-medium text-slate-900", children: "Solicitud:" }),
            " ",
            ADJUSTMENT_TYPE_LABELS[adjustmentRequestToDelete.requestType],
            " \xB7",
            " ",
            formatShortDate(adjustmentRequestToDelete.requestDate),
            " \xB7",
            " ",
            formatTimeOnly(adjustmentRequestToDelete.requestedTime)
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("p", { className: "mt-2", children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "font-medium text-slate-900", children: "Motivo:" }),
            " ",
            adjustmentRequestToDelete.reason
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm text-slate-700", children: "\xBFSeguro que quieres ocultar esta solicitud?" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex justify-end gap-2", children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
            Button,
            {
              variant: "secondary",
              className: POPUP_NEUTRAL_BUTTON_CLASS,
              onClick: () => setAdjustmentRequestToDelete(null),
              disabled: Boolean(deletingAdjustmentRequestId),
              children: "Cancelar"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
            Button,
            {
              className: POPUP_DANGER_BUTTON_CLASS,
              onClick: deleteAdjustmentRequest,
              disabled: Boolean(deletingAdjustmentRequestId),
              children: deletingAdjustmentRequestId ? "Ocultando..." : "Ocultar"
            }
          )
        ] })
      ] })
    ] }) }) : null,
    isWorkerMode && showRequestModal ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "space-y-1", children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("h3", { className: "text-base font-semibold text-slate-900", children: "Solicitar fichaje anterior" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm text-slate-600", children: "Pide una entrada o salida de una fecha anterior." })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
          Button,
          {
            variant: "secondary",
            className: POPUP_NEUTRAL_BUTTON_CLASS,
            onClick: () => setShowRequestModal(false),
            children: "Cerrar"
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "mt-4 space-y-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "grid gap-4 sm:grid-cols-2 sm:items-start", children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
            Select,
            {
              id: "requestType",
              label: "Tipo de solicitud",
              className: "h-[42px] rounded-lg",
              value: requestType,
              onChange: (event) => setRequestType(event.target.value),
              options: [
                { value: "CHECK_IN", label: "Entrada" },
                { value: "CHECK_OUT", label: "Salida" }
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
            Input,
            {
              label: "Fecha y hora solicitadas",
              type: "datetime-local",
              className: "h-[42px] rounded-lg",
              value: requestedTime,
              onChange: (event) => setRequestedTime(event.target.value)
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "space-y-2", children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
            "label",
            {
              className: "block text-sm font-medium text-slate-700",
              htmlFor: "requestReason",
              children: "Motivo *"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
            "textarea",
            {
              id: "requestReason",
              className: "min-h-[88px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400",
              required: true,
              value: requestReason,
              onChange: (event) => setRequestReason(event.target.value)
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-xs text-slate-500", children: "El motivo es obligatorio para poder enviar la solicitud." })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex justify-end gap-2", children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
            Button,
            {
              variant: "secondary",
              className: POPUP_NEUTRAL_BUTTON_CLASS,
              onClick: () => setShowRequestModal(false),
              children: "Cancelar"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
            Button,
            {
              className: POPUP_PRIMARY_BUTTON_CLASS,
              disabled: requestSubmitting,
              onClick: submitAdjustmentRequest,
              children: "Enviar solicitud"
            }
          )
        ] })
      ] })
    ] }) }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      Modal,
      {
        open: showLocationHelp,
        onClose: () => setShowLocationHelp(false),
        title: "Ayuda para fichar con ubicaci\xF3n",
        panelClassName: "max-w-xl",
        children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "space-y-4 text-sm text-slate-700", children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "rounded-xl border border-sky-200 bg-sky-50 px-4 py-3", children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "font-medium text-slate-900", children: "Si el navegador bloquea la ubicaci\xF3n:" }),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("ol", { className: "mt-3 list-decimal space-y-2 pl-5 leading-relaxed", children: [
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("li", { children: "Haz clic en el candado o en el icono de ubicaci\xF3n junto a la barra de direcciones." }),
              /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("li", { children: [
                "Cambia el permiso de ubicaci\xF3n a ",
                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("strong", { children: "Permitir" }),
                "."
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("li", { children: "Recarga la p\xE1gina y vuelve a intentar fichar." })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600", children: "Si sigue sin funcionar, revisa tambi\xE9n los permisos de ubicaci\xF3n del navegador en la configuraci\xF3n del sistema." }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "flex justify-end", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
            Button,
            {
              variant: "secondary",
              className: POPUP_NEUTRAL_BUTTON_CLASS,
              onClick: () => setShowLocationHelp(false),
              children: "Entendido"
            }
          ) })
        ] })
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      Modal,
      {
        open: !!selectedRecordForDetail,
        onClose: () => setSelectedRecordForDetail(null),
        title: "Detalle del Fichaje",
        children: selectedRecordForDetail && renderRecordDetailContent(selectedRecordForDetail)
      }
    )
  ] });
}

// src/features/time-control/WorkerTimeControlWorkspace.tsx
var import_jsx_runtime10 = __toESM(require_jsx_runtime(), 1);
function WorkerTimeControlWorkspace({
  session
}) {
  const [activeTab, setActiveTab] = (0, import_react6.useState)("overview");
  const description = activeTab === "overview" ? "Desde aqu\xED puedes registrar tu entrada, tu salida y consultar tu historial de jornadas." : "Aqu\xED puedes revisar el estado de tus regularizaciones y las notas de revisi\xF3n asociadas.";
  const tabButtonClasses = (tab) => `flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 ${activeTab === tab ? "bg-slate-900 text-white shadow-sm" : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`;
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("section", { className: "mx-auto max-w-6xl space-y-6", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
    TimeControlFeature,
    {
      session,
      mode: "worker",
      workerView: activeTab,
      headerSlot: /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "space-y-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "flex min-h-[110px] flex-col justify-center rounded-3xl border border-stone-200 bg-white px-6 py-5 shadow-sm", children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("h2", { className: "text-2xl font-extrabold tracking-tight text-slate-900", children: "Mi control horario" }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { className: "mt-2 max-w-3xl text-sm text-slate-600", children: description })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "flex min-h-[110px] items-center rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "grid grid-cols-2 gap-1", children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
            "button",
            {
              type: "button",
              onClick: () => setActiveTab("overview"),
              className: tabButtonClasses("overview"),
              children: "Mi control horario"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
            "button",
            {
              type: "button",
              onClick: () => setActiveTab("requests"),
              className: tabButtonClasses("requests"),
              children: "Mis solicitudes"
            }
          )
        ] }) })
      ] })
    }
  ) });
}
export {
  WorkerTimeControlWorkspace
};
/*! Bundled license information:

react/cjs/react.development.js:
  (**
   * @license React
   * react.development.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react/cjs/react-jsx-runtime.development.js:
  (**
   * @license React
   * react-jsx-runtime.development.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)
*/
