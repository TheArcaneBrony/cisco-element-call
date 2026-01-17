{
  description = "A macro to host element call on a Cisco WebEx device.";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
    }:
    flake-utils.lib.eachSystem flake-utils.lib.allSystems (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
        };
        lib = pkgs.lib;
      in
      {
        packages = {
          default =
            let
              filteredSrc = lib.fileset.toSource {
                root = ./.;
                fileset = (
                  lib.fileset.intersection ./. (
                    lib.fileset.unions [
                      ./src
                      ./package.json
                      ./package-lock.json
                      ./tsconfig.json
                    ]
                  )
                );
              };
            in
            pkgs.buildNpmPackage {
              pname = "cisco-element-call";
              name = "cisco-element-call";

              meta = with lib; {
                description = "A maco to host element call on a Cisco WebEx device.";
                homepage = "https://github.com/TheArcaneBrony/cisco-element-call";
                #license = licenses.agpl3Plus;
                platforms = platforms.all;
                mainProgram = "start-macro";
              };

              src = filteredSrc;
              nativeBuildInputs = with pkgs; [ python3 ];
              npmDeps = pkgs.importNpmLock { npmRoot = filteredSrc; };
              npmConfigHook = pkgs.importNpmLock.npmConfigHook;

              makeCacheWritable = true;
              postPatch = ''
                substituteInPlace package.json --replace 'npx patch-package' '${pkgs.nodePackages.patch-package}/bin/patch-package'
              '';
              installPhase = ''
                runHook preInstall
                set -x
                #remove packages not needed for production, or at least try to...
                npm prune --omit dev --no-save $npmInstallFlags "''${npmInstallFlagsArray[@]}" $npmFlags "''${npmFlagsArray[@]}"
                find node_modules -maxdepth 1 -type d -empty -delete

                mkdir -p $out
                cp -r dist node_modules package.json $out/
                makeWrapper ${pkgs.nodejs}/bin/node $out/bin/start-macro --prefix NODE_PATH : $out/node_modules --add-flags $out/dist/index.js

                set +x
                runHook postInstall
              '';
            };
        };

        devShell = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs
            nodePackages.typescript
            nodePackages.ts-node
            #nodePackages.patch-package
            nodePackages.prettier
          ];
        };
      }
    );
}
