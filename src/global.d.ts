import * as React from 'react';

declare module 'aos';
declare module 'react-rating';
declare module 'cleave.js/react';
declare module '@vtaits/react-color-picker';
declare module 'react-color';
declare module 'react-dual-listbox';
declare module 'react-table';
declare module 'feather-icons-react';
declare module 'moment';
declare module 'react-apexcharts';
declare module 'react-scrollspy';
declare module 'react-select';
declare module 'react-dragula';
declare module "react-beautiful-dnd";


declare global {
  namespace JSX {
    interface IntrinsicElements {
      'lord-icon': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        trigger?: string;
        colors?: string;
        delay?: string;
        state?: string;
        target?: string;
        stroke?: string;
      };
    }
  }
}