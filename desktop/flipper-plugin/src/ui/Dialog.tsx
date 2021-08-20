/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {Alert, Input, Modal, Radio, Space, Typography} from 'antd';
import {createState, useValue} from '../state/atom';
import React from 'react';
import {renderReactRoot} from '../utils/renderReactRoot';
import {Layout} from './Layout';
import {Spinner} from './Spinner';

type DialogResult<T> = Promise<false | T> & {close: () => void};

type BaseDialogOptions = {
  title: string;
  okText?: string;
  cancelText?: string;
  width?: number;
};

const defaultWidth = 400;

export const Dialog = {
  show<T>(
    opts: BaseDialogOptions & {
      defaultValue: T;
      children: (currentValue: T, setValue: (v: T) => void) => React.ReactNode;
      onConfirm?: (currentValue: T) => Promise<T>;
      onValidate?: (value: T) => string;
    },
  ): DialogResult<T> {
    let cancel: () => void;

    return Object.assign(
      new Promise<false | T>((resolve) => {
        const state = createState<T>(opts.defaultValue);
        const submissionError = createState<string>('');

        // create inline component to subscribe to dialog state
        const DialogComponent = ({onHide}: {onHide: () => void}) => {
          const currentValue = useValue(state);
          const currentError = useValue(submissionError);

          const setCurrentValue = (v: T) => {
            state.set(v);
            if (opts.onValidate) {
              submissionError.set(opts.onValidate(v));
            }
          };

          return (
            <Modal
              title={opts.title}
              visible
              okText={opts.okText}
              cancelText={opts.cancelText}
              onOk={async () => {
                try {
                  const value = opts.onConfirm
                    ? await opts.onConfirm(currentValue)
                    : currentValue!;
                  onHide();
                  resolve(value);
                } catch (e) {
                  submissionError.set(e.toString());
                }
              }}
              okButtonProps={{
                disabled: opts.onValidate
                  ? !!opts.onValidate(currentValue) // non-falsy value means validation error
                  : false,
              }}
              onCancel={cancel}
              width={opts.width ?? defaultWidth}>
              <Layout.Container gap>
                {opts.children(currentValue, setCurrentValue)}
                {currentError && <Alert type="error" message={currentError} />}
              </Layout.Container>
            </Modal>
          );
        };

        renderReactRoot((hide) => {
          cancel = () => {
            hide();
            resolve(false);
          };
          return <DialogComponent onHide={hide} />;
        });
      }),
      {
        close() {
          cancel();
        },
      },
    );
  },

  confirm({
    message,
    onConfirm,
    ...rest
  }: {
    message: React.ReactNode;
    onConfirm?: () => Promise<true>;
  } & BaseDialogOptions): DialogResult<true> {
    return Dialog.show<true>({
      ...rest,
      defaultValue: true,
      children: () => message,
      onConfirm: onConfirm,
    });
  },

  alert({
    message,
    type,
    ...rest
  }: {
    message: React.ReactNode;
    type: 'info' | 'error' | 'warning' | 'success';
  } & BaseDialogOptions): Promise<void> & {close(): void} {
    let modalRef: ReturnType<typeof Modal['info']>;
    return Object.assign(
      new Promise<void>((resolve) => {
        modalRef = Modal[type]({
          afterClose: resolve,
          content: message,
          ...rest,
        });
      }),
      {
        close() {
          modalRef.destroy();
        },
      },
    );
  },

  prompt({
    message,
    defaultValue,
    onConfirm,
    ...rest
  }: BaseDialogOptions & {
    message: React.ReactNode;
    defaultValue?: string;
    onConfirm?: (value: string) => Promise<string>;
  }): DialogResult<string> {
    return Dialog.show<string>({
      ...rest,
      defaultValue: defaultValue ?? '',
      children: (value, onChange) => (
        <Layout.Container gap>
          <Typography.Text>{message}</Typography.Text>
          <Input value={value} onChange={(e) => onChange(e.target.value)} />
        </Layout.Container>
      ),
      onValidate: (value) => (value ? '' : 'No input provided'),
      onConfirm,
    });
  },

  options({
    message,
    onConfirm,
    options,
    ...rest
  }: BaseDialogOptions & {
    message: React.ReactNode;
    options: {label: string; value: string}[];
    onConfirm?: (value: string) => Promise<string>;
  }): DialogResult<string | false> {
    return Dialog.show<string>({
      ...rest,
      defaultValue: undefined as any,
      onValidate: (value) =>
        value === undefined ? 'Please select an option' : '',
      children: (value, onChange) => (
        <Layout.Container gap style={{maxHeight: '50vh', overflow: 'auto'}}>
          <Typography.Text>{message}</Typography.Text>
          <Radio.Group
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
            }}>
            <Space direction="vertical">
              {options.map((o) => (
                <Radio value={o.value} key={o.value}>
                  {o.label}
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        </Layout.Container>
      ),
      onConfirm,
    });
  },

  loading({
    title,
    message,
    width,
  }: {
    title?: string;
    message: React.ReactNode;
    width?: number;
  }) {
    let cancel: () => void;

    return Object.assign(
      new Promise<void>((resolve) => {
        renderReactRoot((hide) => {
          cancel = () => {
            hide();
            resolve();
          };
          return (
            <Modal
              title={title ?? 'Loading...'}
              visible
              footer={null}
              width={width ?? defaultWidth}
              closable={false}>
              <Layout.Container gap center>
                <Spinner />
                {message}
              </Layout.Container>
            </Modal>
          );
        });
      }),
      {
        close() {
          cancel();
        },
      },
    );
  },
};
