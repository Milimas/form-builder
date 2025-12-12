import { useEffect, useRef } from 'react';
import { EditorState, StateEffect, StateField, type Range } from '@codemirror/state';
import { EditorView, Decoration, DecorationSet } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';

interface CodeMirrorEditorProps {
    value: string;
    readOnly?: boolean;
    height?: string;
    className?: string;
    errorPaths?: string[];
    validPaths?: string[];
}

// Create effect for updating error highlights
const setErrorsEffect = StateEffect.define<string[]>();
const setValidEffect = StateEffect.define<string[]>();

// State field to track highlighted lines
const highlightField = StateField.define<DecorationSet>({
    create() {
        return Decoration.none;
    },
    update(decorations, tr) {
        decorations = decorations.map(tr.changes);

        for (const effect of tr.effects) {
            if (effect.is(setErrorsEffect)) {
                const errorPaths = effect.value;
                const marks: Range<Decoration>[] = [];
                const doc = tr.state.doc;

                // Find lines containing error paths
                for (let i = 1; i <= doc.lines; i++) {
                    const line = doc.line(i);
                    const lineText = line.text;

                    for (const path of errorPaths) {
                        const pathParts = path.split('.');
                        const fieldName = pathParts[pathParts.length - 1];
                        if (lineText.includes(`"${fieldName}"`)) {
                            marks.push(
                                Decoration.line({ class: 'cm-error-line' }).range(line.from)
                            );
                            break;
                        }
                    }
                }

                decorations = Decoration.set(marks, true);
            }

            if (effect.is(setValidEffect)) {
                const validPaths = effect.value;
                const marks: Range<Decoration>[] = [];
                const doc = tr.state.doc;

                // Find lines containing valid paths
                for (let i = 1; i <= doc.lines; i++) {
                    const line = doc.line(i);
                    const lineText = line.text;

                    for (const path of validPaths) {
                        const pathParts = path.split('.');
                        const fieldName = pathParts[pathParts.length - 1];
                        if (lineText.includes(`"${fieldName}"`)) {
                            marks.push(
                                Decoration.line({ class: 'cm-valid-line' }).range(line.from)
                            );
                            break;
                        }
                    }
                }

                decorations = Decoration.set(marks, true);
            }
        }

        return decorations;
    },
    provide: f => EditorView.decorations.from(f)
});

export function CodeMirrorEditor({
    value,
    readOnly = true,
    height = '400px',
    className = '',
    errorPaths = [],
    validPaths = [],
}: CodeMirrorEditorProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<EditorView | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const extensions = [basicSetup, json(), oneDark, highlightField];

        const state = EditorState.create({
            doc: value,
            extensions: [
                ...extensions,
                EditorState.readOnly.of(readOnly),
            ],
        });

        const view = new EditorView({
            state,
            parent: containerRef.current,
        });

        editorRef.current = view;

        return () => {
            view.destroy();
        };
    }, [readOnly, value]);

    // Update content when value changes
    useEffect(() => {
        if (editorRef.current && editorRef.current.state.doc.toString() !== value) {
            editorRef.current.dispatch({
                changes: {
                    from: 0,
                    to: editorRef.current.state.doc.length,
                    insert: value,
                },
            });
        }
    }, [value]);

    // Update error/valid highlights
    useEffect(() => {
        if (!editorRef.current) return;

        if (errorPaths.length > 0) {
            editorRef.current.dispatch({
                effects: setErrorsEffect.of(errorPaths)
            });
        } else if (validPaths.length > 0) {
            editorRef.current.dispatch({
                effects: setValidEffect.of(validPaths)
            });
        }
    }, [errorPaths, validPaths]);

    return (
        <div
            ref={containerRef}
            className={`border border-gray-300 rounded-lg overflow-hidden ${className}`}
            style={{ height }}
        />
    );
}
