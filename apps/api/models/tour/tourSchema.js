import mongoose from "mongoose";

// 관광지 데이터 스키마
const tourSchema = new mongoose.Schema(
  {
    contentid: {
      type: String,
      required: false,
      unique: false,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    addr1: {
      type: String,
      required: false,
    },
    addr2: {
      type: String,
    },
    areacode: {
      type: String,
    },
    sigungucode: {
      type: String,
    },
    mapx: {
      type: String,
      required: false,
    },
    mapy: {
      type: String,
      required: false,
    },
    tel: {
      type: String,
    },
    firstimage: {
      type: String,
    },
    firstimage2: {
      type: String,
    },
    overview: {
      type: String,
    },
    cat1: {
      type: String,
    },
    cat2: {
      type: String,
    },
    cat3: {
      type: String,
    },
    contenttypeid: {
      type: String,
    },
    createdtime: {
      type: String,
    },
    modifiedtime: {
      type: String,
    },
    booktour: {
      type: String,
    },
    mlevel: {
      type: String,
    },
    zipcode: {
      type: String,
    },
    homepage: {
      type: String,
    },
    // 추가 필드들
    source: {
      type: String,
      default: "Korea Tourism Organization",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// 인덱스 설정
tourSchema.index({ contentid: 1 });
tourSchema.index({ mapx: 1, mapy: 1 });
tourSchema.index({ areacode: 1, sigungucode: 1 });
tourSchema.index({ cat1: 1, cat2: 1, cat3: 1 });
tourSchema.index({ title: "text", addr1: "text" }); // 텍스트 검색용

export default mongoose.model("Tours", tourSchema, "tours_new");
