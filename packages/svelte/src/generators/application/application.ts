import {
  convertNxGenerator,
  formatFiles,
  generateFiles,
  getWorkspaceLayout,
  joinPathFragments, logger,
  names,
  offsetFromRoot, stripIndents,
  Tree
} from '@nrwl/devkit';
import { NormalizedSchema, SvelteApplicationSchema } from './schema';
import { addProject } from './lib/add-project';
import { initGenerator } from '../init/init';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import { addLinting } from './lib/add-linting';
import { addCypress } from './lib/add-cypress';
import { addJest } from './lib/add-jest';
import { updateJestConfig } from './lib/update-jest-config';

function normalizeOptions(
  tree: Tree,
  options: SvelteApplicationSchema
): NormalizedSchema {
  const { appsDir } = getWorkspaceLayout(tree);
  const name = names(options.name).fileName;
  const projectDirectory = options.directory
    ? joinPathFragments(`${names(options.directory).fileName}/${name}`)
    : name;
  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const fileName = projectName;
  const projectRoot = joinPathFragments(`${appsDir}/${projectDirectory}`);
  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : [];

  return {
    ...options,
    name: projectName,
    projectRoot,
    parsedTags,
    fileName,
    projectDirectory,
    skipFormat: false,
  };
}

function createFiles(host: Tree, options: NormalizedSchema) {
  generateFiles(
    host,
    joinPathFragments(__dirname, './files'),
    options.projectRoot,
    {
      ...options,
      ...names(options.name),
      offsetFromRoot: offsetFromRoot(options.projectRoot),
    }
  );

  if (options?.bundler === 'vite') {
    host.delete(joinPathFragments(`${options.projectRoot}/public/index.html`));
  } else {
    host.delete(joinPathFragments(options.projectRoot,'index.html'));
    host.delete(joinPathFragments(options.projectRoot,'vite.config.js'));
  }
}

export async function applicationGenerator(
  tree: Tree,
  schema: SvelteApplicationSchema
) {
  const options = normalizeOptions(tree, schema);

  const initTask = await initGenerator(tree, { ...options, skipFormat: true });

  addProject(tree, options);
  createFiles(tree, options);

  const lintTask = await addLinting(tree, options);
  const jestTask = await addJest(tree, options);
  const cypressTask = await addCypress(tree, options);
  updateJestConfig(tree, options);

  if (!options.skipFormat) {
    await formatFiles(tree);
  }

  if(options.bundler === 'vite') {
    logger.info(stripIndents`
    ****************************************************
    **  The Vite feature is experimental, be aware!!  **
    ****************************************************
    `);
  }

  return runTasksInSerial(initTask, lintTask, jestTask, cypressTask);
}

export default applicationGenerator;
export const applicationSchematic = convertNxGenerator(applicationGenerator);
