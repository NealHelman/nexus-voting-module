/**
 * Important note - This file is imported into module_preload.js, either directly or
 * indirectly, and will be a part of the preload script for modules, therefore:
 * - Be picky with importing stuffs into this file, especially for big
 * files and libraries. The bigger the preload scripts get, the slower the modules
 * will load.
 * - Don't assign anything to `global` variable because it will be passed
 * into modules' execution environment.
 * - Make sure this note also presents in other files which are imported here.
 */

import styled from '@emotion/styled';
import { HTMLAttributes } from 'react';

const Svg = styled.svg<{
  size?: string | number;
}>(({ size = '1em' }) => ({
  verticalAlign: 'middle',
  transitionProperty: 'fill, stroke',
  transitionDuration: '.2s',
  width: size,
  height: size,
}));

interface IconProps extends HTMLAttributes<SVGSVGElement> {
  icon: SvgIcon;
  size?: string | number;
}

const Icon = ({ icon, size, ...rest }: IconProps) => (
  <Svg viewBox={icon.viewBox} size={size} {...rest}>
    <use href={`${icon.url ? icon.url : ''}#${icon.id}`} />
  </Svg>
);

// Icon.Raw = forwardRef(({ icon, size, ...rest }, ref) => (
//   <Svg
//     as="img"
//     src={icon.url}
//     viewBox={icon.viewBox}
//     size={size}
//     {...rest}
//     ref={ref}
//   />
// ));

export default Icon;

export interface SvgIcon {
  id: string;
  viewBox: string;
  url?: string;
}
