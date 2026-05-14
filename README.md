# Crate-O BETA

NOTE: BETA VERSION: This is a new version of Crate-O which uses [RO-Crate Machine Actionable Schemas and Profiles](https://github.com/Language-Research-Technology/ro-crate-masp/) to configure 

==

Crate-O is a browser-based editor for Research Object Crates [(RO-Crate)](https://www.researchobject.org/ro-crate/). RO-Crate is a flexible, developer-friendly approach to linked-data description and packaging. Crate-O is designed to:

- describe files on a user’s computer and add contextual information about those files
- optionally skip the files and describe abstract contextual entities such as in a Cultural Collection or an encyclopaedia
- annotate existing resources elsewhere on the web
- import bulk metadata from an Excel spreadsheet.


NOTE: Crate-O is for Google Chrome and related browsers ONLY at this stage as it describes files on the user's computer, and saves RO-Crate metadata there. We will be releasing a version that can be deployed as part of a service that accesses online resources directly, which will be compatible with other browsers (see the [Roadmap](https://github.com/Language-Research-Technology/crate-o#roadmap--backlog)).

While the current version of Crate-O is designed for editing self-contained RO-Crates (and works fine with crates containing tens of thousands of entities) - our roadmap includes editing fragments of larger linked-data resources, and integration with Arkisto repositories such as the [Oni](https://github.com/Language-Research-Technology/oni) repository, data API & search portal.

Crate-O is currently developed by the Language Data Commons of Australia ([LDaCA](https://www.ldaca.edu.au/)), under the guidance of Peter Sefton as technical lead. If the tool is adopted in other contexts (we are in talks with a few groups about this) then we aim to establish a steering committee / reference group to help guide development.


# Developer Documentation

For more technical information on Crate-O processes, refer to the [Developer Documentation](./docs).

<br>

## Crate-O aims to be a general purpose tool

Crate-O is designed to be a general-purpose RO-Crate editor that will work in a number of contexts with or without a server to store Crates. Because RO-Crate is built on JSON-LD, Crate-O can also be used as a simple general-purpose linked data editor, provided the use case aligns with the main constraints imposed by RO-Crate; that entities have to be serialized to JSON-LD in a particular way, with a flattened @graph array of all entities.

# Configuring with Mode Files

This version of Crate-O uses[RO-Crate Machine Actionable Schemas and Profiles](https://github.com/Language-Research-Technology/ro-crate-masp/).  





[IDN]: https://mspgh.unimelb.edu.au/centres-institutes/centre-for-health-equity/research-group/indigenous-data-network
[RO-Crate Excel]: https://github.com/Arkisto-Platform/ro-crate-excel
[RO-Crate]: https://www.researchobject.org/ro-crate/
[OWL]: https://www.w3.org/OWL/
[SHACL]: https://www.w3.org/TR/shacl/
[SoSS]: https://schema.org/docs/schemas.html
[Language Data Commons Vocabulary]: https://purl.archive.org/language-data-commons-terms
[ARDC]: https://ardc.edu.au/
[LDaCA]: https://ldaca.edu.au
[RO-Crate-js]: https://github.com/Arkisto-Platform/ro-crate-js
[Nyingarn]: https://nyingarn.net/
[Oni]: https://github.com/Arkisto-Platform/oni
[TK Labels]: https://localcontexts.org/labels/traditional-knowledge-labels/
[Describo]: https://github.com/Describo
[Arkisto]: https://arkisto-platform.github.io/
[Data Packs]: https://github.com/describo/data-packs
[RO-Crate Excel]: https://github.com/Language-Research-Technology/ro-crate-excel
