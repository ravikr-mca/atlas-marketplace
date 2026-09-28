import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Box } from '@mui/material';

// Read-only Tiptap render for GP listing narratives — using the real editor in
// `editable: false` mode (not just dangerouslySetInnerHTML) so the same sanitized,
// structured document model that a GP authors with is what every viewer renders,
// with no separate markdown/HTML rendering path to keep in sync.
export function TiptapViewer({ html }: { html: string }) {
  const editor = useEditor({
    content: html,
    editable: false,
    extensions: [StarterKit],
  });

  return (
    <Box
      sx={{
        '& .ProseMirror': {
          outline: 'none',
          '& p': { mb: 1.5, lineHeight: 1.7 },
          '& p:last-child': { mb: 0 },
        },
      }}
    >
      <EditorContent editor={editor} />
    </Box>
  );
}
