import { isAbsolute, join } from 'path';
import { workspace, Uri } from 'vscode';
import { basename } from 'path';
import {
    PrettierVSCodeConfig,
    Prettier,
    PrettierSupportInfo,
    ParserOption,
} from './types.d';

const bundledPrettier = require('prettier') as Prettier;

export function getConfig(uri?: Uri): PrettierVSCodeConfig {
    return workspace.getConfiguration('prettier', uri) as any;
}

export function getParsersFromLanguageId(
    languageId: string,
    prettierInstance: Prettier,
    path?: string
): ParserOption[] {
    const language = getSupportLanguages(prettierInstance).find(
        lang =>
            Array.isArray(lang.vscodeLanguageIds) &&
            lang.vscodeLanguageIds.includes(languageId) &&
            // Only for some specific filenames
            (lang.extensions.length > 0 ||
                (path != null &&
                    lang.filenames != null &&
                    lang.filenames.includes(basename(path))))
    );
    if (!language) {
        return [];
    }
    return language.parsers;
}

export function allEnabledLanguages(): string[] {
    return getSupportLanguages().reduce(
        (ids, language) => [...ids, ...(language.vscodeLanguageIds || [])],
        [] as string[]
    );
}

export function rangeSupportedLanguages(): string[] {
    return [
        'javascript',
        'javascriptreact',
        'typescript',
        'typescriptreact',
        'json',
        'graphql',
    ];
}

export function getGroup(group: string): PrettierSupportInfo['languages'] {
    return getSupportLanguages().filter(language => language.group === group);
}

function getSupportLanguages(prettierInstance: Prettier = bundledPrettier) {
    // prettier.getSupportInfo was added in prettier@1.8.0
    if (prettierInstance.getSupportInfo) {
        return prettierInstance.getSupportInfo(prettierInstance.version).languages;
    } else {
        return bundledPrettier.getSupportInfo(prettierInstance.version).languages;
    }
}

/**
 * Get absolute path for relative or absolute filePath.
 * Relative to uri's workspace folder in relative case.
 */
export function getAbsolutePath(uri: Uri, filePath: string): string | undefined {
    if (!filePath) {
        return undefined;
    }
    if (isAbsolute(filePath)) {
        return filePath;
    }
    if (workspace.workspaceFolders) {
        const folder = workspace.getWorkspaceFolder(uri);
        return folder && join(folder.uri.fsPath, filePath);
    }
    return undefined;
}
