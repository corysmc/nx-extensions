import {
  chain,
  externalSchematic,
  noop,
  Rule,
  schematic,
} from '@angular-devkit/schematics';
import { StorybookConfigureSchema } from './schema';
import { wrapAngularDevkitSchematic } from '@nrwl/devkit/ngcli-adapter';

export function storybookConfigurationSchematic(options: StorybookConfigureSchema): Rule {
  return chain([
    schematic('storybook-init', options),
    options.configureCypress
      ? externalSchematic('@nrwl/storybook', 'cypress-project', {
          name: options.name,
          js: options.js,
          linter: options.linter,
        })
      : noop(),
  ]);
}

export default storybookConfigurationSchematic;
export const storybookConfigurationGenerator = wrapAngularDevkitSchematic(
  '@nxext/stencil',
  'storybook-configuration'
);
