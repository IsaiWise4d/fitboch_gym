"use client";

import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  tablePlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  ListsToggle,
  InsertTable,
  CreateLink,
  linkDialogPlugin,
  linkPlugin,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import "./rutina-editor.css"; // Archivo para estilos específicos

interface Props {
  markdown: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}

export default function RutinaEditor({ markdown, onChange, readOnly = false }: Props) {
  return (
    <div
      className={`rutina-mdx-editor overflow-hidden rounded-md border border-border bg-background transition-all ${
        readOnly ? "read-only-mode" : "editing-mode"
      }`}
    >
      <MDXEditor
        className="dark-theme dark-editor"
        readOnly={readOnly}
        markdown={markdown}
        onChange={onChange}
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          markdownShortcutPlugin(),
          tablePlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          ...(readOnly
            ? []
            : [
                toolbarPlugin({
                  toolbarContents: () => (
                    <div className="flex w-full flex-wrap items-center gap-1 border-b border-border bg-surface p-1">
                      <UndoRedo />
                      <div className="h-4 w-[1px] bg-border mx-1" />
                      <BlockTypeSelect />
                      <div className="h-4 w-[1px] bg-border mx-1" />
                      <BoldItalicUnderlineToggles />
                      <div className="h-4 w-[1px] bg-border mx-1" />
                      <ListsToggle />
                      <div className="h-4 w-[1px] bg-border mx-1" />
                      <InsertTable />
                      <CreateLink />
                    </div>
                  ),
                }),
              ]),
        ]}
      />
    </div>
  );
}
