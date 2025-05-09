declare module '*.css' {
  const styles: { [className: string]: string };
  export default styles;
}

declare module 'react-toastify/dist/ReactToastify.css' {
  const content: any;
  export default content;
}