import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  BoxGeometry,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Geometry,
  Vector3,
  Face3,
  ShapeUtils,
  Vector2,
  Texture,
  LinearFilter,
  Color
} from 'three';

import { generateTextureVertices } from 'clmtrackr/js/utils/points';
import Deformer from '../Deformer';


const RAD_TO_DEG = 180 / Math.PI;
const DEG_TO_RAD = Math.PI / 180;


export default class ThreeDeformer extends Deformer {

  private scene: Scene;
  private camera: PerspectiveCamera;

  private renderer: WebGLRenderer;

  private maskMesh: Mesh;
  private bgMesh: Mesh;

  private bgScaleX: number;
  private bgScaleY: number;


  constructor () {
    super();
  }

  public init (canvas: HTMLCanvasElement): void {
    super.init(canvas);

    this.renderer = new WebGLRenderer({ canvas });
    this.renderer.setSize(canvas.width, canvas.height);

    this.scene = new Scene();
    this.camera = new PerspectiveCamera(
      75,
      canvas.width / canvas.height,
      1,
      10000
    );
    this.camera.position.z = 1000;

    // Make the background
    const tan = Math.tan(this.camera.fov / 2 * DEG_TO_RAD) * (2 * this.camera.position.z);
    const bgGeom = new PlaneGeometry(
      tan * this.camera.aspect,
      tan
    );
    const bgMat = new MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true
    });
    this.bgMesh = new Mesh(bgGeom, bgMat);
    this.scene.add(this.bgMesh);

    this.bgScaleX = bgGeom.parameters.width / canvas.width;
    this.bgScaleY = bgGeom.parameters.height / canvas.height;

    // Mask the mask geometry
    const maskGeom = new Geometry();
    const maskMat = new MeshBasicMaterial({
      color: 0xff0000,
      wireframe: true
    });

    this.maskMesh = new Mesh(maskGeom, maskMat);

    // Dont add mask to scene until it is ready
    this.once('maskReady', () => {
      this.scene.add(this.maskMesh);
    })
  }

  public setBackground (element: HTMLElement): void {
    const texture = new Texture(element);
    texture.minFilter = LinearFilter;
    const bgMaterial = this.bgMesh.material;
    bgMaterial.map = texture;
    // Un-set the defaults
    bgMaterial.wireframe = false;
    bgMaterial.color.set(0xffffff);
  }

  protected updateMaskTexture (): HTMLElement {
    const srcElement = super.updateMaskTexture();
    if (!srcElement) { return; }
    // Update mask texture
    const texture = new Texture(srcElement);
    texture.minFilter = LinearFilter;
    const maskMaterial = this.maskMesh.material;
    maskMaterial.map = texture;
    // Un-set the defaults
    maskMaterial.wireframe = false;
    maskMaterial.color.set(0xffffff);
    return;
  }

  public setPoints (points: number[][]): void {
    super.setPoints(points);

    const geom = this.maskMesh.geometry;
    geom.faceVertexUvs = [[]];
    const faceVertexUvs = geom.faceVertexUvs[0];
    geom.faces = [];
    geom.vertices = [];

    for (let i = 0; i < this._maskTextureCoord.length; i += 6) {
      const vertIndex = Math.floor(i / 6 * 3);
      // Standin verts
      geom.vertices[vertIndex] = new Vector3();
      geom.vertices[vertIndex + 1] = new Vector3();
      geom.vertices[vertIndex + 2] = new Vector3();
      // Add a face
      geom.faces.push(new Face3(
        vertIndex,
        vertIndex + 1,
        vertIndex + 2
      ));
      // Texture it
      faceVertexUvs.push([
        new Vector2(this._maskTextureCoord[i], this._maskTextureCoord[i + 1]),
        new Vector2(this._maskTextureCoord[i + 2], this._maskTextureCoord[i + 3]),
        new Vector2(this._maskTextureCoord[i + 4], this._maskTextureCoord[i + 5])
      ]);
    }

    geom.uvsNeedUpdate = true;
    geom.elementsNeedUpdate = true;
  }

  private updateMaskGeom (points: number[][]): void {
    const maskVertices = generateTextureVertices(points, this._verticeMap);

    const geom = this.maskMesh.geometry;

    const bgW = this.bgMesh.geometry.parameters.width;
    const bgH = this.bgMesh.geometry.parameters.height;
    const offsetX = bgW * -0.5;
    const offsetY = bgH * -0.5;

    for (let i = 0; i < maskVertices.length; i += 6) {
      const vertIndex = Math.floor(i / 6 * 3);

      const v1 = geom.vertices[vertIndex];
      v1.x = (maskVertices[i] * this.bgScaleX) + offsetX;
      v1.y = (bgH - (maskVertices[i + 1] * this.bgScaleY)) + offsetY;

      const v2 = geom.vertices[vertIndex + 1];
      v2.x = (maskVertices[i + 2] * this.bgScaleX) + offsetX;
      v2.y = (bgH - (maskVertices[i + 3] * this.bgScaleY)) + offsetY;

      const v3 = geom.vertices[vertIndex + 2];
      v3.x = (maskVertices[i + 4] * this.bgScaleX) + offsetX;
      v3.y = (bgH - (maskVertices[i + 5] * this.bgScaleY)) + offsetY;
    }

    geom.verticesNeedUpdate = true;
  }

  public draw (points: number[][]): void {
    // Update the scene
    // TODO: this should move to a separate tick function to avoid rendering
    // hiccups
    this.updateMaskGeom(points);

    // Update bg texture
    const bgTex = this.bgMesh.material.map;
    if (bgTex) {
      bgTex.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
  }

  public drawGrid (): void { }
}
