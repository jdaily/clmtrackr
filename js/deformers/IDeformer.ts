interface IDeformer {
  init (canvas: HTMLCanvasElement): void;

  load (
    canvas: HTMLCanvasElement,
    points: Number[][],
    tracker,
    bgElement: HTMLElement
  ): void;

  draw (points: Number[][]): void;

  setPoints (points: Number[][]): void;

  setMaskTexture (element: HTMLElement): void;

  getGLContext (): WebGLRenderingContext;
}

export default IDeformer;
