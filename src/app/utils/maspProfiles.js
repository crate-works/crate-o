import { ROCrate } from 'ro-crate';
import * as maspValidatorModule from 'ro-crate-maps/lib/masp-validator.js';
import profileMetadataUrlsConfig from '../../../crate-o-masp-config.json';

const { MaspValidator } = maspValidatorModule;

const profileDebugEnabled = (() => {
  if (typeof window === 'undefined') return false;
  return window.localStorage?.getItem('crateOProfileDebug') !== '0';
})();

function profileDebug(...args) {
  if (!profileDebugEnabled) return;
  console.log('[crate-o:profile]', ...args);
}

function hasLayoutGroups(editorHints) {
  const propertyGroups = editorHints?.propertyGroups;
  return Array.isArray(propertyGroups) && propertyGroups.length > 0;
}

function withDefaultLayout(editorHints, fallbackPropertyGroups = []) {
  const baseHints = editorHints || {};
  if (hasLayoutGroups(baseHints)) {
    return baseHints;
  }
  if (!Array.isArray(fallbackPropertyGroups) || fallbackPropertyGroups.length === 0) {
    return baseHints;
  }
  return {
    ...baseHints,
    propertyGroups: fallbackPropertyGroups
  };
}

function buildProfile(profileCrateJson, editorHints, fallbackPropertyGroups = [], profileBaseUrl = null) {
  const crate = new ROCrate(profileCrateJson, { array: true, link: true });
  const effectiveHints = withDefaultLayout(editorHints, fallbackPropertyGroups);
  const validator = new MaspValidator(crate).setEditorHints(effectiveHints);
  if (profileBaseUrl && validator?.setProfileBaseUrl) {
    validator.setProfileBaseUrl(profileBaseUrl);
  }
  validator.ensureParsed();
  const metadata = validator.getProfileMetadata?.() || {};
  const groupNames = (validator.getPropertyGroups?.() || []).map((g) => g?.name).filter(Boolean);
  profileDebug('buildProfile', {
    name: metadata.name,
    usedSchemaOrgFallbackGroups: !hasLayoutGroups(editorHints) && groupNames.length > 0,
    groupCount: groupNames.length,
    groups: groupNames,
    conformsTo: validator.getConformsToUris?.() || []
  });
  return validator;
}

function buildProfileWithSourceUrl(profileCrateJson, editorHints, metadataUrl, fallbackPropertyGroups = []) {
  return buildProfile(profileCrateJson, editorHints, fallbackPropertyGroups, metadataUrl);
}

function normalizeUriList(value) {
  return Array.from(new Set(
    (Array.isArray(value) ? value : [])
      .filter((uri) => typeof uri === 'string')
      .map((uri) => uri.trim())
      .filter(Boolean)
  ));
}

function normalizeProfileConfig(entry) {
  if (typeof entry === 'string') {
    return {
      maspCrateUrl: entry,
      name: entry,
      conformsTo: [],
    };
  }
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const maspCrateUrl = typeof entry.maspCrateUrl === 'string' ? entry.maspCrateUrl.trim() : '';
  const name = typeof entry.name === 'string' && entry.name.trim() ? entry.name.trim() : maspCrateUrl;
  const conformsTo = normalizeUriList(entry.conformsTo);
  if (!maspCrateUrl || !name) {
    return null;
  }

  return {
    ...entry,
    maspCrateUrl,
    name,
    conformsTo,
  };
}

function getEditorHintsUrl(maspCrateUrl) {
  try {
    const url = new URL(maspCrateUrl);
    url.search = '';
    url.hash = '';
    url.pathname = url.pathname.replace(/\/ro-crate-metadata\.json$/, '/crate-o-mode.json');
    return url.toString();
  } catch (_error) {
    return maspCrateUrl.replace(/ro-crate-metadata\.json(?:\?.*)?$/, 'crate-o-mode.json');
  }
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url} (HTTP ${response.status})`);
  }
  return response.json();
}

function getConfiguredProfiles() {
  if (!Array.isArray(profileMetadataUrlsConfig)) {
    return [];
  }
  return profileMetadataUrlsConfig
    .map(normalizeProfileConfig)
    .filter(Boolean);
}

async function loadProfileDefinition(profileConfig) {
  const profileCrateJson = await fetchJson(profileConfig.maspCrateUrl);

  const editorHintsUrl = getEditorHintsUrl(profileConfig.maspCrateUrl);
  let editorHints = {};
  try {
    editorHints = await fetchJson(editorHintsUrl);
  } catch (error) {
    profileDebug('loadEditorHintsFailed', { metadataUrl: profileConfig.maspCrateUrl, editorHintsUrl, message: error?.message });
  }

  return { ...profileConfig, profileCrateJson, editorHints };
}

async function loadProfilesFromConfig() {
  const profileConfigs = getConfiguredProfiles();

  const schemaOrgProfileConfig =
    profileConfigs.find((profile) => profile.name === 'RO-Crate + Schema.org Profile') ||
    profileConfigs.find((profile) => profile.maspCrateUrl.includes('/schema-org/')) ||
    null;

  let schemaOrgProfile = null;
  if (schemaOrgProfileConfig) {
    try {
      const schemaOrgDefinition = await loadProfileDefinition(schemaOrgProfileConfig);
      schemaOrgProfile = buildProfileWithSourceUrl(
        schemaOrgDefinition.profileCrateJson,
        schemaOrgDefinition.editorHints,
        schemaOrgDefinition.maspCrateUrl
      );
    } catch (error) {
      profileDebug('loadSchemaOrgFailed', { metadataUrl: schemaOrgProfileConfig.maspCrateUrl, message: error?.message });
    }
  }

  const schemaOrgFallbackGroups = schemaOrgProfile?.getPropertyGroups?.() || [];

  const lazyProfiles = profileConfigs.map((profileConfig) => {
    if (schemaOrgProfile && profileConfig.maspCrateUrl === schemaOrgProfileConfig?.maspCrateUrl) {
      return schemaOrgProfile;
    }

    let loadedProfile = null;
    let loadingPromise = null;
    const metadata = {
      name: profileConfig.name,
      description: profileConfig.maspCrateUrl,
    };

    const ensureLoaded = async () => {
      if (loadedProfile) {
        return loadedProfile;
      }
      if (!loadingPromise) {
        loadingPromise = loadProfileDefinition(profileConfig)
          .then((definition) => {
            loadedProfile = buildProfileWithSourceUrl(
              definition.profileCrateJson,
              definition.editorHints,
              definition.maspCrateUrl,
              schemaOrgFallbackGroups
            );
            const loadedMetadata = loadedProfile.getProfileMetadata?.() || {};
            metadata.description = loadedMetadata.description || metadata.description;
            return loadedProfile;
          })
          .catch((error) => {
            loadingPromise = null;
            throw error;
          });
      }
      return loadingPromise;
    };

    return {
      metadata,
      ensureLoaded,
      getProfileMetadata() {
        if (!loadedProfile?.getProfileMetadata) {
          return metadata;
        }
        const loadedMetadata = loadedProfile.getProfileMetadata() || {};
        return {
          ...loadedMetadata,
          name: metadata.name,
          description: loadedMetadata.description || metadata.description,
        };
      },
      getEnabledClasses() {
        return loadedProfile?.getEnabledClasses?.() || [];
      },
      getLookups() {
        return loadedProfile?.getLookups?.() || {};
      },
      getClassDefinition(type) {
        return loadedProfile?.getClassDefinition?.(type) || null;
      },
      getPropertyGroups() {
        return loadedProfile?.getPropertyGroups?.() || [];
      },
      getConformsToUris() {
        return profileConfig.conformsTo.length > 0
          ? profileConfig.conformsTo
          : (loadedProfile?.getConformsToUris?.() || []);
      },
      getProfileUri() {
        return profileConfig.conformsTo[0] || loadedProfile?.getProfileUri?.() || null;
      },
      getProfileEntity() {
        const loadedEntity = loadedProfile?.getProfileEntity?.() || null;
        if (loadedEntity) {
          return loadedEntity;
        }

        const profileUri = profileConfig.conformsTo[0] || null;
        if (!profileUri) {
          return null;
        }

        return {
          '@id': profileUri,
          '@type': ['CreativeWork', 'Profile'],
          name: profileConfig.name,
          url: profileConfig.maspCrateUrl.replace(/ro-crate-metadata\.json(?:\?.*)?$/, ''),
        };
      },
      async validateCrate(crate) {
        const profile = await ensureLoaded();
        return profile.validateCrate(crate);
      },
    };
  });

  if (schemaOrgProfile && !lazyProfiles.includes(schemaOrgProfile)) {
    lazyProfiles.unshift(schemaOrgProfile);
  }

  return lazyProfiles;
}

export const maspProfiles = [];

export const maspProfilesPromise = loadProfilesFromConfig().then((profiles) => {
  maspProfiles.splice(0, maspProfiles.length, ...profiles);

  profileDebug('profilesLoaded', maspProfiles.map((p, index) => {
    const metadata = p.getProfileMetadata?.() || {};
    const groups = (p.getPropertyGroups?.() || []).map((g) => g?.name).filter(Boolean);
    return {
      index,
      name: metadata.name,
      groupCount: groups.length,
      groups
    };
  }));

  return maspProfiles;
});
