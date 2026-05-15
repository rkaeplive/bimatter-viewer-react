import cl from "./BimatterLoader.module.scss";
interface BimatterLoaderProps {
    loading: boolean;
    isTransparent?: boolean;
    needProgress?: boolean;
}
const BimatterLoader = ({
    loading,
    isTransparent = false,
    needProgress = false,
}: BimatterLoaderProps) => {
    const loadingProgress = "";
    if (!loading) return <></>;
    return (
        <div
            className={
                isTransparent ? cl.loader__wrap__transparent : cl.loader__wrap
            }
        >
            <div className={[cl.loading, cl.loadingAct].join(" ")}>
                <span data-text="b">b</span>
                <span data-text="i">i</span>
                <span data-text="m">m</span>
                <span data-text="a">a</span>
                <span data-text="t">t</span>
                <span data-text="t">t</span>
                <span data-text="e">e</span>
                <span data-text="r">r</span>
            </div>
            {needProgress && (
                <div className={cl.progressLoading}>{loadingProgress}</div>
            )}
        </div>
    );
};

export default BimatterLoader;
